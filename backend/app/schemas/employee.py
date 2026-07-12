"""Employee schemas for auth and user management."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "Admin"
    ASSET_MANAGER = "Asset_Manager"
    DEPARTMENT_HEAD = "Department_Head"
    EMPLOYEE = "Employee"


class UserStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    department_id: Optional[int] = None


class EmployeeCreate(EmployeeBase):
    password: str = Field(..., min_length=6, max_length=100)

    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@company.com",
                "password": "securepassword123",
                "phone": "+1234567890",
                "department_id": 1
            }
        }


class EmployeeLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john.doe@company.com",
                "password": "securepassword123"
            }
        }


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    department_id: Optional[int] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    profile_photo_url: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    employee_id: int
    role: UserRole
    status: UserStatus
    profile_photo_url: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    full_name: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: EmployeeResponse


class TokenData(BaseModel):
    employee_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
