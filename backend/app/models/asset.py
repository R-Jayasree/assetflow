"""Asset model."""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, DECIMAL, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class AssetStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ALLOCATED = "Allocated"
    RESERVED = "Reserved"
    UNDER_MAINTENANCE = "Under_Maintenance"
    LOST = "Lost"
    RETIRED = "Retired"
    DISPOSED = "Disposed"


class AssetCondition(str, enum.Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"
    DAMAGED = "Damaged"


class Asset(Base):
    __tablename__ = "assets"

    asset_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_tag = Column(String(20), unique=True, nullable=False, index=True)
    asset_name = Column(String(200), nullable=False)
    category_id = Column(Integer, ForeignKey("asset_categories.category_id"), nullable=False)
    serial_number = Column(String(100))
    model = Column(String(100))
    manufacturer = Column(String(100))
    acquisition_date = Column(DateTime)
    acquisition_cost = Column(DECIMAL(15, 2))
    current_condition = Column(Enum(AssetCondition), default=AssetCondition.GOOD)
    location = Column(String(200))
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    is_bookable = Column(Boolean, default=False)
    status = Column(Enum(AssetStatus), default=AssetStatus.AVAILABLE)
    custom_field_values = Column(Text)
    photo_urls = Column(Text)
    document_urls = Column(Text)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    category = relationship("AssetCategory", back_populates="assets")
    department = relationship("Department", back_populates="assets")
    creator = relationship("Employee", back_populates="created_assets")
    allocations = relationship("AssetAllocation", back_populates="asset")
    bookings = relationship("Booking", back_populates="asset")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="asset")
