"""Asset Transfer model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TransferStatus(str, enum.Enum):
    REQUESTED = "Requested"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class AssetTransfer(Base):
    __tablename__ = "asset_transfers"

    transfer_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=False)
    from_allocation_id = Column(Integer, ForeignKey("asset_allocations.allocation_id"), nullable=False)
    from_employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    to_employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    to_department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    requested_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    request_date = Column(DateTime)
    approval_date = Column(DateTime)
    expected_return_date = Column(DateTime)
    transfer_reason = Column(Text)
    status = Column(Enum(TransferStatus), default=TransferStatus.REQUESTED)
    rejection_reason = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    requester = relationship("Employee", foreign_keys=[requested_by], back_populates="transfers_requested")
    asset = relationship("Asset")
