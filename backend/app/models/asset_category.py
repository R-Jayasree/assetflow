"""Asset Category model."""
from sqlalchemy import Column, Integer, String, Enum, DateTime, DECIMAL, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class CategoryStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class AssetCategory(Base):
    __tablename__ = "asset_categories"

    category_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_name = Column(String(100), nullable=False)
    category_code = Column(String(20), unique=True)
    description = Column(Text)
    custom_fields_schema = Column(Text)
    depreciation_rate = Column(DECIMAL(5, 2))
    status = Column(Enum(CategoryStatus), default=CategoryStatus.ACTIVE)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    assets = relationship("Asset", back_populates="category")
