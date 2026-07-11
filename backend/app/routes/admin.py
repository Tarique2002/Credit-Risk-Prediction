from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
import pandas as pd
from typing import List, Optional

from app.database import get_db
from app import schemas, models, crud
from app.security import require_admin, log_audit_action
from app.ml.monitor import analyze_feature_drift

router = APIRouter(prefix="/admin", tags=["System Administration"])

@router.get("/logs", response_model=dict)
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by audit action"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Retrieves paginated audit logs for system operations compliance (Admin only)."""
    logs, total = crud.get_audit_logs(db, skip, limit, action)
    
    formatted_logs = []
    for log in logs:
        email = log.user.email if log.user else "System Action"
        formatted_logs.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_email": email,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "timestamp": log.timestamp
        })
        
    return {
        "items": formatted_logs,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/drift", response_model=schemas.DriftAnalysisResponse)
def get_feature_drift(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Calculates data and feature drift (PSI) between active prediction logs and baseline training data."""
    # Retrieve recent prediction logs
    prediction_records = db.query(models.PredictionRecord).order_by(models.PredictionRecord.created_at.desc()).limit(500).all()
    
    recent_features_list = []
    for record in prediction_records:
        if record.customer:
            c = record.customer
            recent_features_list.append({
                "income": c.income,
                "employment_status": c.employment_status,
                "employment_duration_months": c.employment_duration_months,
                "debt_to_income_ratio": c.debt_to_income_ratio,
                "payment_history_score": c.payment_history_score,
                "existing_loans_count": c.existing_loans_count,
                "total_debt": c.total_debt,
                "savings_balance": c.savings_balance
            })
            
    recent_df = pd.DataFrame(recent_features_list)
    drift_report = analyze_feature_drift(recent_df)
    
    # Fill in schema fields
    if "overall_psi" not in drift_report:
        return schemas.DriftAnalysisResponse(
            overall_psi=0.0,
            feature_drift={},
            drift_detected=False,
            model_version="1.0.0",
            total_predictions_evaluated=0
        )
        
    return schemas.DriftAnalysisResponse(
        overall_psi=drift_report["overall_psi"],
        feature_drift={
            k: schemas.DriftFeatureMetrics(psi=v["psi"], drift_status=v["drift_status"])
            for k, v in drift_report["feature_drift"].items()
        },
        drift_detected=drift_report["drift_detected"],
        model_version=drift_report["model_version"],
        total_predictions_evaluated=drift_report["total_predictions_evaluated"]
    )

@router.get("/users", response_model=List[schemas.UserResponse])
def get_users_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Lists all registered system users (Admin only)."""
    return crud.list_users(db, skip, limit)

@router.put("/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    role_payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Changes a user's RBAC role (Admin only)."""
    new_role = role_payload.get("role")
    if new_role not in ["admin", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role selected. Options are: admin, analyst."
        )
        
    target_user = crud.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self role demotion is locked. You cannot modify your own administrative role."
        )
        
    old_role = target_user.role
    target_user.role = new_role
    db.commit()
    db.refresh(target_user)
    
    log_audit_action(
        db,
        action="USER_ROLE_UPDATED",
        details=f"User {target_user.email} role updated from {old_role} to {new_role}",
        user_id=current_user.id,
        request=request
    )
    
    return target_user
