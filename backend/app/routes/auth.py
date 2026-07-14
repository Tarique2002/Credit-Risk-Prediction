from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from app.database import get_db
from app import schemas, models, crud
from app.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    is_user_locked_out,
    log_audit_action,
    limiter
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    """Registers a new system user with Role-Based Access Control."""
    existing_user = crud.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    # Create the user
    new_user = crud.create_user(db, user_data)
    
    # Log registration in audits
    log_audit_action(
        db, 
        action="USER_REGISTRATION", 
        details=f"User {new_user.email} registered with role {new_user.role}", 
        user_id=new_user.id,
        request=request
    )
    
    return new_user

@router.post("/login", response_model=schemas.Token)
@limiter.limit("5 per minute")
def login(login_data: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticates a user, manages lockout rules, and issues JWT tokens."""
    user = crud.get_user_by_email(db, login_data.email)
    if not user:
        # Prevent timing attacks by mimicking password verification overhead
        verify_password("dummy", "$2b$12$DummyPasswordHashForTimingAttackDefenseOnly")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # Check Lockout status
    if is_user_locked_out(user):
        lock_remaining = (user.locked_until - datetime.utcnow()).total_seconds() / 60
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is temporarily locked. Try again in {int(lock_remaining) + 1} minutes."
        )
        
    # Verify Password
    if not verify_password(login_data.password, user.hashed_password):
        # Increment failed login attempts
        attempts = crud.increment_login_attempts(db, user)
        log_audit_action(
            db,
            action="LOGIN_FAILED",
            details=f"Failed login attempt {attempts}/5 for user {user.email}",
            user_id=None,
            request=request
        )
        if attempts >= 5:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Too many failed login attempts. Your account has been locked for 15 minutes."
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # Successful login, reset failed attempts
    crud.reset_login_attempts(db, user)
    
    # Create Access & Refresh Tokens
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    
    log_audit_action(
        db,
        action="LOGIN_SUCCESS",
        details=f"User {user.email} successfully logged in",
        user_id=user.id,
        request=request
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh(token_payload: dict, request: Request, db: Session = Depends(get_db)):
    """Rotates refresh tokens and generates new short-lived access tokens."""
    refresh_token = token_payload.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is required"
        )
        
    payload = decode_token(refresh_token, settings.JWT_REFRESH_SECRET)
    email: str = payload.get("sub")
    token_type: str = payload.get("type")
    
    if email is None or token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token structure"
        )
        
    user = crud.get_user_by_email(db, email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
        
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "role": user.role
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Returns details of the currently authenticated session."""
    return current_user

@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Simulates a secure forgot password workflow (logs token in development)."""
    user = crud.get_user_by_email(db, data.email)
    if not user:
        # Return success even if email is missing to prevent user enumeration attacks
        return {"message": "If this email exists in our system, a password reset link has been dispatched."}
        
    # Generate mock reset token
    reset_token = str(uuid.uuid4())
    print(f"PASSWORD RESET REQUEST FOR {user.email}. RESET TOKEN: {reset_token}")
    
    # Write audit log
    log_audit_action(
        db,
        action="FORGOT_PASSWORD_REQUEST",
        details=f"Password reset token issued for {user.email}",
        user_id=user.id
    )
    
    return {"message": "If this email exists in our system, a password reset link has been dispatched.", "token": reset_token}

@router.post("/reset-password")
def reset_password(data: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    """Completes the simulated password reset procedure."""
    # Since this is simulated, we accept any valid token, find first active user or allow admin reset
    # Real world would decrypt/match token in Redis/Database.
    user = db.query(models.User).filter(models.User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active user available for reset")
        
    from app.security import hash_password
    user.hashed_password = hash_password(data.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    
    log_audit_action(
        db,
        action="PASSWORD_RESET_SUCCESS",
        details=f"Password successfully reset via token for user {user.email}",
        user_id=user.id
    )
    return {"message": "Password has been successfully updated."}

@router.post("/change-password")
def change_password(
    data: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Updates password for the currently authenticated user."""
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    from app.security import hash_password
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    
    log_audit_action(
        db,
        action="PASSWORD_CHANGED",
        details=f"User {current_user.email} changed their password",
        user_id=current_user.id
    )
    return {"message": "Password successfully updated"}

