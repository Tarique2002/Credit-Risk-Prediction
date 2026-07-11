from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="analyst", nullable=False)  # admin, analyst
    is_active = Column(Boolean, default=True, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    income = Column(Float, nullable=False)  # Annual Income
    employment_status = Column(String, nullable=False)  # employed, unemployed, self_employed, retired
    employment_duration_months = Column(Integer, nullable=False)
    debt_to_income_ratio = Column(Float, nullable=False)  # Debt-to-income ratio (DTI)
    payment_history_score = Column(Float, nullable=False)  # 0 to 100 on-time payment percent
    existing_loans_count = Column(Integer, default=0, nullable=False)
    total_debt = Column(Float, default=0.0, nullable=False)
    savings_balance = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    loans = relationship("LoanApplication", back_populates="customer", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="customer", cascade="all, delete-orphan")

class LoanApplication(Base):
    __tablename__ = "loan_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    loan_amount = Column(Float, nullable=False)
    loan_purpose = Column(String, nullable=False)  # debt_consolidation, home_improvement, education, medical, business, other
    term_months = Column(Integer, nullable=False)
    interest_rate = Column(Float, nullable=False)
    status = Column(String, default="pending", nullable=False)  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="loans")

class PredictionRecord(Base):
    __tablename__ = "prediction_records"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    model_name = Column(String, nullable=False)
    default_probability = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    credit_score = Column(Integer, nullable=False)
    risk_category = Column(String, nullable=False)  # Very Low, Low, Medium, High, Very High
    recommendation = Column(String, nullable=False)  # Approve, Reject
    shap_explanations = Column(Text, nullable=True)  # JSON representation of feature importances
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="predictions")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
