from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from io import BytesIO, StringIO
import csv

from app.database import get_db
from app import models, crud
from app.security import require_analyst
from app.services.reports import generate_risk_pdf
from app.services.credit_score import calculate_credit_score
from app.services.fraud import detect_fraud_alerts
from app.ml.explain import explain_prediction

router = APIRouter(prefix="/reports", tags=["Export & Reporting"])

@router.get("/pdf/{customer_id}")
def download_risk_report_pdf(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_analyst)
):
    """Generates and downloads a detailed, styled credit assessment report in PDF format."""
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )
        
    # Get latest prediction or calculate one dynamically
    predictions = crud.get_predictions_by_customer(db, customer_id)
    
    if predictions:
        latest = predictions[0]
        prob = latest.default_probability
        score = latest.credit_score
        risk_cat = latest.risk_category
        rec = latest.recommendation
    else:
        # Calculate dynamic prediction
        import pandas as pd
        input_dict = {
            "income": [customer.income],
            "employment_status": [customer.employment_status],
            "employment_duration_months": [customer.employment_duration_months],
            "debt_to_income_ratio": [customer.debt_to_income_ratio],
            "payment_history_score": [customer.payment_history_score],
            "existing_loans_count": [customer.existing_loans_count],
            "total_debt": [customer.total_debt],
            "savings_balance": [customer.savings_balance]
        }
        explanation_res = explain_prediction(pd.DataFrame(input_dict))
        prob = explanation_res["prediction_probability"]
        
        score_res = calculate_credit_score(
            default_probability=prob,
            payment_history_score=customer.payment_history_score,
            debt_to_income_ratio=customer.debt_to_income_ratio,
            savings_balance=customer.savings_balance,
            existing_loans_count=customer.existing_loans_count,
            income=customer.income
        )
        score = score_res["credit_score"]
        risk_cat = score_res["risk_category"]
        rec = score_res["recommendation"]
        
    score_details = calculate_credit_score(
        default_probability=prob,
        payment_history_score=customer.payment_history_score,
        debt_to_income_ratio=customer.debt_to_income_ratio,
        savings_balance=customer.savings_balance,
        existing_loans_count=customer.existing_loans_count,
        income=customer.income
    )
    
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
    
    customer_dict = {
        "first_name": customer.first_name,
        "last_name": customer.last_name,
        "email": customer.email,
        "phone": customer.phone,
        "income": customer.income,
        "employment_status": customer.employment_status,
        "employment_duration_months": customer.employment_duration_months,
        "debt_to_income_ratio": customer.debt_to_income_ratio,
        "payment_history_score": customer.payment_history_score,
        "existing_loans_count": customer.existing_loans_count,
        "total_debt": customer.total_debt,
        "savings_balance": customer.savings_balance
    }
    
    prediction_dict = {
        "default_probability": prob,
        "credit_score": score,
        "risk_category": risk_cat,
        "recommendation": rec
    }
    
    # Generate ReportLab PDF
    pdf_buffer = generate_risk_pdf(
        customer=customer_dict,
        prediction=prediction_dict,
        suggestions=score_details["suggestions"],
        fraud_flags=fraud_flags
    )
    
    filename = f"credit_risk_report_{customer.first_name}_{customer.last_name}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/export/csv")
def export_predictions_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_analyst)
):
    """Exports the entire credit risk prediction audit history into a CSV spreadsheet."""
    predictions = db.query(models.PredictionRecord).order_by(models.PredictionRecord.created_at.desc()).all()
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Prediction ID", "Customer Name", "Customer Email", "Model Name", 
        "Default Probability (%)", "Risk Score (0-100)", "Credit Score (300-850)", 
        "Risk Category", "Lending Recommendation", "Calculated Timestamp"
    ])
    
    for r in predictions:
        name = "Unknown Profile"
        email = "N/A"
        if r.customer:
            name = f"{r.customer.first_name} {r.customer.last_name}"
            email = r.customer.email
            
        writer.writerow([
            r.id, name, email, r.model_name,
            f"{r.default_probability * 100:.2f}", f"{r.risk_score:.2f}", r.credit_score,
            r.risk_category, r.recommendation, r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
        
    output.seek(0)
    csv_bytes = output.getvalue().encode("utf-8")
    
    filename = f"credit_predictions_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
