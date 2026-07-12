"""Maintenance Request model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, DECIMAL, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class MaintenanceStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    TECHNICIAN_ASSIGNED = "Technician_Assigned"
    IN_PROGRESS = "In_Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class Priority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    request_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=False)
    requested_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    photo_urls = Column(Text)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.PENDING)
    rejection_reason = Column(Text)
    resolution_notes = Column(Text)
    estimated_cost = Column(DECIMAL(15, 2))
    actual_cost = Column(DECIMAL(15, 2))
    requested_at = Column(DateTime)
    approved_at = Column(DateTime)
    started_at = Column(DateTime)
    resolved_at = Column(DateTime)
    closed_at = Column(DateTime)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    asset = relationship("Asset", back_populates="maintenance_requests")
    requester = relationship("Employee", foreign_keys=[requested_by], back_populates="maintenance_requests")
