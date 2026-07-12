"""Booking model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class BookingStatus(str, enum.Enum):
    UPCOMING = "Upcoming"
    ONGOING = "Ongoing"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=False)
    booked_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    booked_for_dept_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    purpose = Column(Text)
    status = Column(Enum(BookingStatus), default=BookingStatus.UPCOMING)
    cancelled_at = Column(DateTime)
    cancellation_reason = Column(Text)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    asset = relationship("Asset", back_populates="bookings")
    booker = relationship("Employee", back_populates="bookings")
