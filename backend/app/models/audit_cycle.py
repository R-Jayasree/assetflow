"""Audit Cycle model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class AuditStatus(str, enum.Enum):
    PLANNED = "Planned"
    IN_PROGRESS = "In_Progress"
    COMPLETED = "Completed"
    CLOSED = "Closed"


class AuditCycle(Base):
    __tablename__ = "audit_cycles"

    audit_cycle_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    audit_name = Column(String(200), nullable=False)
    scope_type = Column(String(50), nullable=False)
    scope_value = Column(String(100))
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    status = Column(Enum(AuditStatus), default=AuditStatus.PLANNED)
    created_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    closed_at = Column(DateTime)
    closure_notes = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    creator = relationship("Employee")
    assignments = relationship("AuditAssignment", back_populates="audit_cycle")
