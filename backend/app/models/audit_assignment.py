"""Audit Assignment model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In_Progress"
    COMPLETED = "Completed"


class AuditAssignment(Base):
    __tablename__ = "audit_assignments"

    assignment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    audit_cycle_id = Column(Integer, ForeignKey("audit_cycles.audit_cycle_id"), nullable=False)
    auditor_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    assigned_at = Column(DateTime)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ASSIGNED)

    audit_cycle = relationship("AuditCycle", back_populates="assignments")
    auditor = relationship("Employee", back_populates="audit_assignments")
