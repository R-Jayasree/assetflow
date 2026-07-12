"""Notification model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class NotificationType(str, enum.Enum):
    ASSET_ASSIGNED = "Asset_Assigned"
    ASSET_RETURNED = "Asset_Returned"
    TRANSFER_REQUESTED = "Transfer_Requested"
    TRANSFER_APPROVED = "Transfer_Approved"
    TRANSFER_REJECTED = "Transfer_Rejected"
    BOOKING_CONFIRMED = "Booking_Confirmed"
    BOOKING_CANCELLED = "Booking_Cancelled"
    BOOKING_REMINDER = "Booking_Reminder"
    MAINTENANCE_APPROVED = "Maintenance_Approved"
    MAINTENANCE_REJECTED = "Maintenance_Rejected"
    MAINTENANCE_RESOLVED = "Maintenance_Resolved"
    OVERDUE_RETURN = "Overdue_Return"
    AUDIT_ASSIGNED = "Audit_Assigned"
    AUDIT_DISCREPANCY_FLAGGED = "Audit_Discrepancy_Flagged"
    AUDIT_CYCLE_CLOSED = "Audit_Cycle_Closed"
    SYSTEM_ALERT = "System_Alert"


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recipient_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    related_entity_type = Column(String(50))
    related_entity_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    recipient = relationship("Employee", back_populates="notifications")
