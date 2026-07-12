"""Authentication service - business logic for login/signup."""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.employee import Employee, UserRole, UserStatus
from app.schemas.employee import EmployeeCreate, EmployeeLogin, EmployeeUpdate, TokenData
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.core.config import get_settings

settings = get_settings()


class AuthService:
    @staticmethod
    def signup(db: Session, employee_data: EmployeeCreate) -> Employee:
        """Create a new employee account. Role is always Employee - no self-elevation."""
        # Check if email already exists
        existing = db.query(Employee).filter(Employee.email == employee_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new employee with Employee role only
        new_employee = Employee(
            first_name=employee_data.first_name,
            last_name=employee_data.last_name,
            email=employee_data.email,
            password_hash=get_password_hash(employee_data.password),
            phone=employee_data.phone,
            department_id=employee_data.department_id,
            role=UserRole.EMPLOYEE,  # Always Employee - admin promotes later
            status=UserStatus.ACTIVE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)

        return new_employee

    @staticmethod
    def login(db: Session, login_data: EmployeeLogin) -> dict:
        """Authenticate user and return JWT token."""
        # Find employee by email
        employee = db.query(Employee).filter(Employee.email == login_data.email).first()

        if not employee:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if employee.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Contact admin."
            )

        # Verify password
        if not verify_password(login_data.password, employee.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Update last login
        employee.last_login_at = datetime.utcnow()
        db.commit()

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": str(employee.employee_id),
                "email": employee.email,
                "role": employee.role.value
            },
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": employee
        }

    @staticmethod
    def get_current_user(db: Session, token: str) -> Optional[Employee]:
        """Validate token and return current user."""
        payload = decode_access_token(token)
        if payload is None:
            return None

        employee_id = payload.get("sub")
        if employee_id is None:
            return None

        try:
            employee_id = int(employee_id)
        except ValueError:
            return None

        employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
        if employee is None or employee.status != UserStatus.ACTIVE:
            return None

        return employee

    @staticmethod
    def change_password(db: Session, employee_id: int, current_password: str, new_password: str) -> bool:
        """Change user password."""
        employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if not verify_password(current_password, employee.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        employee.password_hash = get_password_hash(new_password)
        employee.updated_at = datetime.utcnow()
        db.commit()

        return True

    @staticmethod
    def promote_employee(db: Session, employee_id: int, new_role: UserRole, promoted_by: int) -> Employee:
        """Admin/Manager promotes an employee to a new role."""
        employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )

        # Only Admin can promote to Admin or Asset_Manager
        # Department_Head can be set by Admin or Asset_Manager
        promoter = db.query(Employee).filter(Employee.employee_id == promoted_by).first()
        if not promoter or promoter.role != UserRole.ADMIN:
            if new_role == UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only Admin can promote to Admin role"
                )

        employee.role = new_role
        employee.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(employee)

        return employee
