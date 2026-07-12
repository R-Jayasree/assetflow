"""Department model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class DeptStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    department_name = Column(String(100), nullable=False)
    department_code = Column(String(20), unique=True)
    parent_department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    department_head_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    description = Column(Text)
    status = Column(Enum(DeptStatus), default=DeptStatus.ACTIVE)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    employees = relationship("Employee", foreign_keys="Employee.department_id", back_populates="department")
    head = relationship("Employee", foreign_keys=[department_head_id])
    assets = relationship("Asset", back_populates="department")
    children = relationship("Department", remote_side=[department_id], backref="parent")
