from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- AUTHENTICATION SCHEMAS ---

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    role: Optional[str] = Field("user", pattern="^(admin|analyst|user)$")

    @field_validator("password")
    @classmethod
    def validate_strong_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class PasswordResetRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

# --- CUSTOMER SCHEMAS ---

class CustomerBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$", description="E.164 phone format")
    income: float = Field(..., ge=0.0, description="Annual Income")
    employment_status: str = Field(..., pattern="^(employed|unemployed|self_employed|retired)$")
    employment_duration_months: int = Field(..., ge=0)
    debt_to_income_ratio: float = Field(..., ge=0.0, le=2.0, description="DTI ratio (0.0 to 2.0)")
    payment_history_score: float = Field(..., ge=0.0, le=100.0, description="0-100 on-time payment percent")
    existing_loans_count: int = Field(0, ge=0)
    total_debt: float = Field(0.0, ge=0.0)
    savings_balance: float = Field(0.0, ge=0.0)

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    skip: int
    limit: int

# --- LOAN APPLICATION SCHEMAS ---

class LoanApplicationBase(BaseModel):
    loan_amount: float = Field(..., gt=0.0)
    loan_purpose: str = Field(..., pattern="^(debt_consolidation|home_improvement|education|medical|business|other)$")
    term_months: int = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0.0, le=100.0)

class LoanApplicationCreate(LoanApplicationBase):
    customer_id: int

class LoanApplicationCreateWithoutCustId(LoanApplicationBase):
    pass

class LoanApplicationResponse(LoanApplicationBase):
    id: int
    customer_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- PREDICTION SCHEMAS ---

class PredictionRequest(BaseModel):
    customer_id: Optional[int] = None
    # Allowed inline parameters if predicting without creating a customer profile
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    income: float = Field(..., ge=0.0)
    employment_status: str = Field(..., pattern="^(employed|unemployed|self_employed|retired)$")
    employment_duration_months: int = Field(..., ge=0)
    debt_to_income_ratio: float = Field(..., ge=0.0, le=2.0)
    payment_history_score: float = Field(..., ge=0.0, le=100.0)
    existing_loans_count: int = Field(0, ge=0)
    total_debt: float = Field(0.0, ge=0.0)
    savings_balance: float = Field(0.0, ge=0.0)

class SHAPFeatureExplanation(BaseModel):
    feature: str
    value: float
    shap_value: float
    contribution: str  # e.g., "Increases Risk", "Decreases Risk", "Neutral"

class PredictionResponse(BaseModel):
    customer_id: Optional[int] = None
    model_name: str
    default_probability: float
    risk_score: float
    credit_score: int
    risk_category: str  # Very Low, Low, Medium, High, Very High
    recommendation: str  # Approve, Reject
    confidence_score: float = 0.0
    shap_explanations: List[SHAPFeatureExplanation] = []
    fraud_flags: List[str] = []
    suggestions: List[str] = []
    created_at: datetime

class CustomerProfileResponse(BaseModel):
    profile: CustomerResponse
    loans: List[LoanApplicationResponse]
    predictions: List[PredictionResponse]

# --- MONITORING & Drift ---

class DriftFeatureMetrics(BaseModel):
    psi: float
    drift_status: str  # No Drift, Moderate Drift, High Drift

class DriftAnalysisResponse(BaseModel):
    overall_psi: float
    feature_drift: Dict[str, DriftFeatureMetrics]
    drift_detected: bool
    model_version: str
    total_predictions_evaluated: int

# --- AUDIT LOG SCHEMA ---

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    details: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True
