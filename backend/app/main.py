import os
import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
import logging

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.security import limiter
from app.routes import auth, customers, predictions, admin, ai, reports

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CreditRiskApp")

app = FastAPI(
    title="Credit Risk Prediction Platform",
    description="Enterprise-grade AI-powered credit risk and default prediction API",
    version="1.0.0",
    docs_url="/swagger" if os.environ.get("ENV") != "production" else None,
    redoc_url=None
)

# Rate Limiting configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
# Adjust origins based on deployment (e.g. settings.FRONTEND_URL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Secure HTTP Headers (Custom middleware to add secure headers)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Standardized Error Handling (No stack traces exposed to clients)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception caught: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact system support."}
    )

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

# Database seeding and model training on startup
@app.on_event("startup")
def startup_event():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Seed Users if database is empty
        from app.models import User
        if db.query(User).count() == 0:
            logger.info("Seeding system administrative users...")
            from app.schemas import UserCreate
            from app.crud import create_user
            
            # Admin User
            admin_schema = UserCreate(
                email="admin@bank.com",
                password="AdminPass123!",
                role="admin"
            )
            create_user(db, admin_schema)
            
            # Analyst User
            analyst_schema = UserCreate(
                email="analyst@bank.com",
                password="AnalystPass123!",
                role="analyst"
            )
            create_user(db, analyst_schema)
            logger.info("Database seeded successfully with default accounts.")
            
        # 2. Seed Customers if empty
        from app.models import Customer
        if db.query(Customer).count() == 0:
            logger.info("Seeding database with sample customer profiles...")
            from app.schemas import CustomerCreate
            from app.crud import create_customer
            
            sample_customers = [
                CustomerCreate(
                    first_name="Jane", last_name="Doe", email="jane.doe@example.com", phone="+14155552671",
                    income=95000.0, employment_status="employed", employment_duration_months=36,
                    debt_to_income_ratio=0.18, payment_history_score=97.0, existing_loans_count=1,
                    total_debt=15000.0, savings_balance=45000.0
                ),
                CustomerCreate(
                    first_name="John", last_name="Smith", email="john.smith@example.com", phone="+14155559876",
                    income=55000.0, employment_status="self_employed", employment_duration_months=12,
                    debt_to_income_ratio=0.48, payment_history_score=78.0, existing_loans_count=3,
                    total_debt=35000.0, savings_balance=1200.0
                ),
                CustomerCreate(
                    first_name="Robert", last_name="Johnson", email="robert.j@example.com", phone="+14155551234",
                    income=120000.0, employment_status="employed", employment_duration_months=72,
                    debt_to_income_ratio=0.28, payment_history_score=94.0, existing_loans_count=2,
                    total_debt=45000.0, savings_balance=60000.0
                ),
                CustomerCreate(
                    first_name="Alice", last_name="Williams", email="alice.w@example.com", phone="+14155557788",
                    income=25000.0, employment_status="unemployed", employment_duration_months=0,
                    debt_to_income_ratio=0.95, payment_history_score=62.0, existing_loans_count=4,
                    total_debt=22000.0, savings_balance=450.0
                )
            ]
            for cust in sample_customers:
                create_customer(db, cust)
            logger.info("Sample customer profiles seeded successfully.")
            
        # 3. Model validation / Auto training on startup
        if settings.AUTO_TRAIN_ON_STARTUP:
            model_file = os.path.join(settings.MODEL_DIR, "model.joblib")
            if not os.path.exists(model_file):
                logger.info("No trained models found. Starting automated pipeline retraining...")
                from app.ml.train import train_and_select_best_model
                train_and_select_best_model()
                logger.info("Models auto-trained and saved.")
            else:
                logger.info("Trained model structures verified.")
                
    except Exception as e:
        logger.error(f"Error during startup seeding/training: {str(e)}", exc_info=True)
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
