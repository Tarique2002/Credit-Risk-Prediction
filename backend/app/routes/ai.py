from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app import models, crud
from app.security import require_analyst
from app.services.gemini_assistant import explain_decision
from app.services.credit_score import calculate_credit_score
from app.services.fraud import detect_fraud_alerts

router = APIRouter(prefix="/ai", tags=["AI Copilot Assistant"])

class AIQuestionRequest(BaseModel):
    first_name: str
    last_name: str
    default_probability: float
    credit_score: int
    risk_category: str
    recommendation: str
    income: float
    debt_to_income_ratio: float
    payment_history_score: float
    existing_loans_count: int
    savings_balance: float
    fraud_flags: list[str]
    question: Optional[str] = None

@router.post("/chat", response_model=dict)
def ask_ai_assistant(
    payload: AIQuestionRequest,
    current_user: models.User = Depends(require_analyst)
):
    """Processes interactive questions regarding credit decisioning using Gemini."""
    try:
        explanation = explain_decision(
            first_name=payload.first_name,
            last_name=payload.last_name,
            probability=payload.default_probability,
            credit_score=payload.credit_score,
            risk_category=payload.risk_category,
            recommendation=payload.recommendation,
            income=payload.income,
            dti=payload.debt_to_income_ratio,
            history_score=payload.payment_history_score,
            fraud_flags=payload.fraud_flags,
            question=payload.question
        )
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Copilot encountered an error: {str(e)}"
        )

@router.get("/summary/{customer_id}", response_model=dict)
def get_customer_ai_summary(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_analyst)
):
    """Generates an executive credit risk summary for a specific customer profile."""
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    # Get latest prediction or calculate dummy prediction variables
    predictions = crud.get_predictions_by_customer(db, customer_id)
    
    if predictions:
        latest = predictions[0]
        prob = latest.default_probability
        score = latest.credit_score
        risk_cat = latest.risk_category
        rec = latest.recommendation
    else:
        # Default fallback values for calculation
        prob = 0.25
        score = 680
        risk_cat = "Medium"
        rec = "Approve"
        
    fraud_flags = detect_fraud_alerts(
        db=db,
        first_name=customer.first_name,
        last_name=customer.last_name,
        email=customer.email,
        phone=customer.phone,
        income=customer.income,
        savings_balance=customer.savings_balance,
        debt_to_income_ratio=customer.debt_to_income_ratio,
        employment_duration_months=customer.employment_duration_months,
        existing_loans_count=customer.existing_loans_count,
        current_customer_id=customer.id
    )
    
    try:
        summary = explain_decision(
            first_name=customer.first_name,
            last_name=customer.last_name,
            probability=prob,
            credit_score=score,
            risk_category=risk_cat,
            recommendation=rec,
            income=customer.income,
            dti=customer.debt_to_income_ratio,
            history_score=customer.payment_history_score,
            fraud_flags=fraud_flags,
            question="Provide a structured executive summary highlighting risk factors, savings capacity, and overall profile."
        )
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed generating executive summary: {str(e)}"
        )
