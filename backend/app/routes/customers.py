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
