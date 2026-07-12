"""Asset Allocation model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class AllocationStatus(str, enum.Enum):
    ACTIVE = "Active"
    RETURNED = "Returned"
    OVERDUE = "Overdue"


class AssetAllocation(Base):
    __tablename__ = "asset_allocations"

    allocation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=False)
    allocated_to_employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    allocated_to_department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    allocated_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    allocation_date = Column(DateTime)
    expected_return_date = Column(DateTime)
    actual_return_date = Column(DateTime)
    return_condition = Column(String(20))
    return_notes = Column(Text)
    status = Column(Enum(AllocationStatus), default=AllocationStatus.ACTIVE)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    asset = relationship("Asset", back_populates="allocations")
    employee = relationship("Employee", foreign_keys=[allocated_to_employee_id], back_populates="allocations")
    department = relationship("Department", foreign_keys=[allocated_to_department_id])
