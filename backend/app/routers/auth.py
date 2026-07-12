"""Authentication router - Login, Signup, Password management."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import decode_access_token
from app.schemas.employee import (
    EmployeeCreate, EmployeeResponse, EmployeeLogin, Token,
    PasswordChange, PasswordResetRequest, PasswordResetConfirm
)
from app.models.employee import Employee, UserRole
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Employee:
    """Dependency to get current authenticated user from JWT token."""
    user = AuthService.get_current_user(db, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(allowed_roles: list[UserRole]):
    """Dependency factory to check user role."""
    def role_checker(current_user: Employee = Depends(get_current_user)) -> Employee:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


# Public endpoints (no auth required)
@router.post("/signup", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def signup(employee_data: EmployeeCreate, db: Session = Depends(get_db)):
    """
    Create a new employee account.

    - Role is always "Employee" — no role selection at signup
    - Admin promotes employees to Department Head or Asset Manager later
    """
    new_employee = AuthService.signup(db, employee_data)
    return new_employee


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login with email and password.

    Returns JWT access token for authenticated requests.
    """
    login_data = EmployeeLogin(email=form_data.username, password=form_data.password)
    result = AuthService.login(db, login_data)

    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "expires_in": result["expires_in"],
        "user": result["user"]
    }


@router.post("/logout")
def logout(current_user: Employee = Depends(get_current_user)):
    """
    Logout current user.

    Note: JWT tokens are stateless. Client should discard the token.
    Optional: Add token to blacklist in Redis for immediate invalidation.
    """
    return {"message": "Successfully logged out", "user_id": current_user.employee_id}


# Protected endpoints (auth required)
@router.get("/me", response_model=EmployeeResponse)
def get_me(current_user: Employee = Depends(get_current_user)):
    """Get current logged-in user profile."""
    return current_user


@router.put("/me", response_model=EmployeeResponse)
def update_profile(
    update_data: dict,  # Will use EmployeeUpdate schema
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile (name, phone, etc.)."""
    # Implementation will be added when Employee module is built
    return current_user


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user password."""
    success = AuthService.change_password(
        db, 
        current_user.employee_id, 
        password_data.current_password, 
        password_data.new_password
    )
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Request password reset.

    Sends reset link to user email (mock implementation for hackathon).
    """
    employee = db.query(Employee).filter(Employee.email == request.email).first()
    if not employee:
        # Return success even if email not found (security best practice)
        return {"message": "If email exists, reset instructions have been sent"}

    # TODO: Generate reset token and send email
    # For hackathon: return mock token
    return {
        "message": "Password reset instructions sent",
        "note": "For demo: use token 'reset-demo-token'"
    }


@router.post("/reset-password")
def reset_password(reset_data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password using token from email."""
    # TODO: Validate token and update password
    return {"message": "Password reset successfully"}


@router.post("/refresh")
def refresh_token(current_user: Employee = Depends(get_current_user)):
    """Refresh access token before expiry."""
    from app.core.security import create_access_token
    from datetime import timedelta
    from app.core.config import get_settings

    settings = get_settings()
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    new_token = create_access_token(
        data={
            "sub": str(current_user.employee_id),
            "email": current_user.email,
            "role": current_user.role.value
        },
        expires_delta=access_token_expires
    )

    return {
        "access_token": new_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
