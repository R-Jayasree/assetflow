"""Audit Discrepancy model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ActualStatus(str, enum.Enum):
    VERIFIED = "Verified"
    MISSING = "Missing"
    DAMAGED = "Damaged"
    WRONG_LOCATION = "Wrong_Location"
    UNKNOWN = "Unknown"


class ResolutionAction(str, enum.Enum):
    STATUS_UPDATED = "Status_Updated"
    MAINTENANCE_RAISED = "Maintenance_Raised"
    REALLOCATED = "Reallocated"
    NO_ACTION = "No_Action"
    OTHER = "Other"


class AuditDiscrepancy(Base):
    __tablename__ = "audit_discrepancies"

    discrepancy_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    audit_cycle_id = Column(Integer, ForeignKey("audit_cycles.audit_cycle_id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=False)
    auditor_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    expected_status = Column(String(50))
    actual_status = Column(Enum(ActualStatus), nullable=False)
    location_found = Column(String(200))
    condition_found = Column(String(20))
    notes = Column(Text)
    photo_urls = Column(Text)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    resolved_at = Column(DateTime)
    resolution_action = Column(Enum(ResolutionAction))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
