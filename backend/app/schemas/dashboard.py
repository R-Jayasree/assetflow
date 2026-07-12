"""Dashboard schemas for KPIs and overview data."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OverdueReturn(BaseModel):
    asset_id: int
    asset_tag: str
    asset_name: str
    asset_status: str
    current_condition: str
    allocation_id: int
    allocated_to_employee_id: Optional[int]
    holder_name: Optional[str]
    holder_email: Optional[str]
    allocated_to_department_id: Optional[int]
    department_name: Optional[str]
    allocation_date: Optional[datetime]
    expected_return_date: Optional[datetime]
    allocation_status: str
    is_overdue: int

    class Config:
        from_attributes = True


class QuickAction(BaseModel):
    action_id: str
    label: str
    icon: str
    route: str
    allowed_roles: List[str]


class DashboardKPIs(BaseModel):
    assets_available: int
    assets_allocated: int
    assets_under_maintenance: int
    assets_lost: int
    active_bookings: int
    pending_transfers: int
    overdue_returns: int
    maintenance_today: int
    total_assets: int

    class Config:
        json_schema_extra = {
            "example": {
                "assets_available": 45,
                "assets_allocated": 32,
                "assets_under_maintenance": 5,
                "assets_lost": 1,
                "active_bookings": 8,
                "pending_transfers": 3,
                "overdue_returns": 2,
                "maintenance_today": 4,
                "total_assets": 83
            }
        }


class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    overdue_returns: List[OverdueReturn]
    upcoming_returns: List[OverdueReturn]
    quick_actions: List[QuickAction]
    recent_notifications: List[dict] = []
