from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models import Customer

def detect_fraud_alerts(
    db: Session,
    first_name: str,
    last_name: str,
    email: str,
    phone: str,
    income: float,
    savings_balance: float,
    debt_to_income_ratio: float,
    employment_duration_months: int,
    existing_loans_count: int,
    current_customer_id: Optional[int] = None
) -> List[str]:
    """Runs a rule-based fraud detection pipeline on incoming financial applications."""
    alerts = []
    
    # 1. Duplicate checks (Name, Email, or Phone already exists under a different ID)
    query = db.query(Customer).filter(
        (Customer.email == email) | 
        (Customer.phone == phone) | 
        ((Customer.first_name == first_name) & (Customer.last_name == last_name))
    )
    if current_customer_id:
        query = query.filter(Customer.id != current_customer_id)
        
    duplicates = query.all()
    if duplicates:
        for dup in duplicates:
            if dup.email == email:
                alerts.append("Duplicate Customer: Email is already associated with another customer record.")
            elif dup.phone == phone:
                alerts.append("Duplicate Customer: Phone number is already associated with another customer record.")
            else:
                alerts.append(f"Identity Mismatch: Customer name '{first_name} {last_name}' already exists in database under a different profile.")
                
    # 2. Synthetic Identity Markers
    # Indicator: Extremely short employment duration but multiple existing loans or high DTI
    if employment_duration_months < 6 and (existing_loans_count > 1 or debt_to_income_ratio > 0.8):
        alerts.append("Synthetic Identity: High leverage/loan frequency with less than 6 months of employment.")
        
    # Indicator: High savings balance but zero income and not retired
    if income < 1000 and savings_balance > 25000:
        alerts.append("Anomalous Income: Zero active income reported but holding a large savings balance.")
        
    # 3. Abnormal Income / Leverage
    # Indicator: Debt to income ratio is extreme
    if debt_to_income_ratio > 1.2:
        alerts.append(f"High Debt Ratio: Leverage ratio ({debt_to_income_ratio:.2f}) exceeds extreme risk threshold (1.20).")
        
    # 4. Identity verification checks
    # Basic phone verification
    clean_phone = "".join(filter(str.isdigit, phone))
    if len(clean_phone) < 7:
        alerts.append("Identity Mismatch: Phone number length is invalid.")
        
    # Checking for invalid repeating digits in phone
    if len(clean_phone) >= 7 and (clean_phone.count(clean_phone[0]) == len(clean_phone) or "1234567" in clean_phone):
        alerts.append("Identity Mismatch: Suspicious phone digits pattern detected.")
        
    return list(set(alerts))
