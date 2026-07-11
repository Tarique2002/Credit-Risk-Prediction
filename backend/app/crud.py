from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
from app import models, schemas
from app.security import hash_password

# --- USER CRUD ---

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def increment_login_attempts(db: Session, user: models.User) -> int:
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= 5:
        user.locked_until = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    db.refresh(user)
    return user.failed_login_attempts

def reset_login_attempts(db: Session, user: models.User):
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

def list_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

# --- CUSTOMER CRUD ---

def get_customer(db: Session, customer_id: int) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def create_customer(db: Session, customer: schemas.CustomerCreate) -> models.Customer:
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def update_customer(db: Session, customer_id: int, customer_data: schemas.CustomerCreate) -> Optional[models.Customer]:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    for key, value in customer_data.model_dump().items():
        setattr(db_customer, key, value)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int) -> bool:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return False
    db.delete(db_customer)
    db.commit()
    return True

def search_customers(db: Session, query: Optional[str] = None, skip: int = 0, limit: int = 20) -> Tuple[List[models.Customer], int]:
    db_query = db.query(models.Customer)
    if query:
        search_filter = or_(
            models.Customer.first_name.ilike(f"%{query}%"),
            models.Customer.last_name.ilike(f"%{query}%"),
            models.Customer.email.ilike(f"%{query}%"),
            models.Customer.phone.ilike(f"%{query}%")
        )
        db_query = db_query.filter(search_filter)
    
    total = db_query.count()
    results = db_query.offset(skip).limit(limit).all()
    return results, total

# --- LOAN APPLICATION CRUD ---

def create_loan_application(db: Session, loan: schemas.LoanApplicationCreate) -> models.LoanApplication:
    db_loan = models.LoanApplication(**loan.model_dump())
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

def get_loans_by_customer(db: Session, customer_id: int) -> List[models.LoanApplication]:
    return db.query(models.LoanApplication).filter(models.LoanApplication.customer_id == customer_id).all()

def update_loan_status(db: Session, loan_id: int, status: str) -> Optional[models.LoanApplication]:
    db_loan = db.query(models.LoanApplication).filter(models.LoanApplication.id == loan_id).first()
    if not db_loan:
        return None
    db_loan.status = status
    db.commit()
    db.refresh(db_loan)
    return db_loan

# --- PREDICTION RECORD CRUD ---

def create_prediction_record(db: Session, prediction: models.PredictionRecord) -> models.PredictionRecord:
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction

def get_prediction_history(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[models.PredictionRecord], int]:
    total = db.query(models.PredictionRecord).count()
    results = db.query(models.PredictionRecord).order_by(desc(models.PredictionRecord.created_at)).offset(skip).limit(limit).all()
    return results, total

def get_predictions_by_customer(db: Session, customer_id: int) -> List[models.PredictionRecord]:
    return db.query(models.PredictionRecord).filter(models.PredictionRecord.customer_id == customer_id).order_by(desc(models.PredictionRecord.created_at)).all()

# --- AUDIT LOGS CRUD ---

def get_audit_logs(db: Session, skip: int = 0, limit: int = 50, action: Optional[str] = None) -> Tuple[List[models.AuditLog], int]:
    db_query = db.query(models.AuditLog)
    if action:
        db_query = db_query.filter(models.AuditLog.action == action)
    
    total = db_query.count()
    results = db_query.order_by(desc(models.AuditLog.timestamp)).offset(skip).limit(limit).all()
    return results, total
