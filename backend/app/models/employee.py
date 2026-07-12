"""Employee model - user accounts."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    ASSET_MANAGER = "Asset_Manager"
    DEPARTMENT_HEAD = "Department_Head"
    EMPLOYEE = "Employee"


class UserStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20))
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    profile_photo_url = Column(String(500))
    last_login_at = Column(DateTime)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    department = relationship("Department", foreign_keys=[department_id], back_populates="employees")
    created_assets = relationship("Asset", back_populates="creator")
    allocations = relationship("AssetAllocation", foreign_keys="AssetAllocation.allocated_to_employee_id", back_populates="employee")
    transfers_requested = relationship("AssetTransfer", foreign_keys="AssetTransfer.requested_by", back_populates="requester")
    bookings = relationship("Booking", back_populates="booker")
    maintenance_requests = relationship("MaintenanceRequest", foreign_keys="MaintenanceRequest.requested_by", back_populates="requester")
    audit_assignments = relationship("AuditAssignment", back_populates="auditor")
    notifications = relationship("Notification", back_populates="recipient")
    activity_logs = relationship("ActivityLog", back_populates="actor")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
