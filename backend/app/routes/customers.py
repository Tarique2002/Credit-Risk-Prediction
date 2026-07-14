from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import schemas, models, crud
from app.security import require_analyst, require_admin, log_audit_action, get_current_user

router = APIRouter(prefix="/customers", tags=["Customer Management"])

@router.get("/", response_model=schemas.CustomerListResponse)
def get_customers(
    query: Optional[str] = Query(None, description="Search term (first name, last name, email)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_analyst)
):
    """Retrieves a paginated list of customers with optional search filtering."""
    customers, total = crud.search_customers(db, query=query, skip=skip, limit=limit)
    return {
        "items": customers,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_data: schemas.CustomerCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_analyst)
):
    """Registers a new customer record."""
    existing_customer = crud.get_customer_by_email(db, customer_data.email)
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer with this email address already exists"
        )
        
    customer = crud.create_customer(db, customer_data)
    
    log_audit_action(
        db,
        action="CUSTOMER_CREATED",
        details=f"Customer {customer.first_name} {customer.last_name} ({customer.email}) created",
        user_id=current_user.id,
        request=request
    )
    return customer

@router.get("/{customer_id}", response_model=schemas.CustomerProfileResponse)
def get_customer_profile(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_analyst)
):
    """Fetches a detailed customer profile, including loan applications and predictions history."""
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    loans = crud.get_loans_by_customer(db, customer_id)
    predictions = crud.get_predictions_by_customer(db, customer_id)
    
    return {
        "profile": customer,
        "loans": loans,
        "predictions": predictions
    }

@router.put("/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer_profile(
    customer_id: int,
    customer_data: schemas.CustomerCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_analyst)
):
    """Updates an existing customer record."""
    customer = crud.update_customer(db, customer_id, customer_data)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    log_audit_action(
        db,
        action="CUSTOMER_UPDATED",
        details=f"Customer ID {customer_id} updated",
        user_id=current_user.id,
        request=request
    )
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_200_OK)
def delete_customer(
    customer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Deletes a customer profile (restricted to admins only)."""
    success = crud.delete_customer(db, customer_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    log_audit_action(
        db,
        action="CUSTOMER_DELETED",
        details=f"Customer ID {customer_id} deleted",
        user_id=current_user.id,
        request=request
    )
    return {"message": "Customer record has been successfully deleted"}

# --- LOANS RELATIONSHIPS ---

@router.post("/{customer_id}/loans", response_model=schemas.LoanApplicationResponse, status_code=status.HTTP_201_CREATED)
def add_loan_application(
    customer_id: int,
    loan_data: schemas.LoanApplicationBase,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_analyst)
):
    """Adds a new loan application under a customer's account."""
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    full_loan_data = schemas.LoanApplicationCreate(
        customer_id=customer_id,
        **loan_data.model_dump()
    )
    loan = crud.create_loan_application(db, full_loan_data)
    
    log_audit_action(
        db,
        action="LOAN_APPLICATION_CREATED",
        details=f"Loan application of ${loan.loan_amount:,.2f} created for customer ID {customer_id}",
        user_id=current_user.id,
        request=request
    )
    return loan

@router.get("/me", response_model=schemas.CustomerProfileResponse)
def get_my_customer_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetches the current logged in user's customer profile, including loan applications and predictions history."""
    customer = crud.get_customer_by_email(db, current_user.email)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrower profile not found for this user account. Please submit an application first."
        )
    loans = crud.get_loans_by_customer(db, customer.id)
    predictions = crud.get_predictions_by_customer(db, customer.id)
    
    import json
    formatted_preds = []
    for p in predictions:
        shaps = []
        if p.shap_explanations:
            try:
                shaps = json.loads(p.shap_explanations)
            except:
                pass
        formatted_preds.append({
            "customer_id": p.customer_id,
            "model_name": p.model_name,
            "default_probability": p.default_probability,
            "risk_score": p.risk_score,
            "credit_score": p.credit_score,
            "risk_category": p.risk_category,
            "recommendation": p.recommendation,
            "confidence_score": 1.0 - abs(p.default_probability - 0.5) * 2.0,
            "shap_explanations": shaps,
            "created_at": p.created_at
        })
        
    return {
        "profile": customer,
        "loans": loans,
        "predictions": formatted_preds
    }

@router.put("/me", response_model=schemas.CustomerResponse)
def update_my_customer_profile(
    customer_data: schemas.CustomerCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Updates the current logged in user's customer profile."""
    # Force the email to be the logged in user's email
    customer_data.email = current_user.email
    customer = crud.get_customer_by_email(db, current_user.email)
    if not customer:
        customer = crud.create_customer(db, customer_data)
    else:
        customer = crud.update_customer(db, customer.id, customer_data)
        
    log_audit_action(
        db,
        action="CUSTOMER_UPDATED",
        details=f"User {current_user.email} updated their own profile details.",
        user_id=current_user.id,
        request=request
    )
    return customer

@router.post("/me/loans", response_model=schemas.LoanApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_my_loan_application(
    loan_data: schemas.LoanApplicationCreateWithoutCustId,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Registers a new loan application for the logged in user."""
    customer = crud.get_customer_by_email(db, current_user.email)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrower profile not found. Please submit a credit assessment first."
        )
        
    full_loan_data = schemas.LoanApplicationCreate(
        customer_id=customer.id,
        loan_amount=loan_data.loan_amount,
        loan_purpose=loan_data.loan_purpose,
        term_months=loan_data.term_months,
        interest_rate=loan_data.interest_rate
    )
    loan = crud.create_loan_application(db, full_loan_data)
    
    # Automatically approve/reject based on latest prediction
    predictions = crud.get_predictions_by_customer(db, customer.id)
    if predictions:
        latest = predictions[0]
        status_val = "approved" if latest.recommendation == "Approve" else "rejected"
        crud.update_loan_status(db, loan.id, status_val)
        loan.status = status_val
    
    log_audit_action(
        db,
        action="LOAN_APPLICATION_CREATED",
        details=f"User {current_user.email} submitted a loan request of ${loan.loan_amount}",
        user_id=current_user.id,
        request=request
    )
    return loan

