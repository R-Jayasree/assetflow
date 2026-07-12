"""Dashboard router - KPIs, overview, quick actions."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.employee import Employee, UserRole
from app.routers.auth import get_current_user, require_role
from app.schemas.dashboard import DashboardResponse, DashboardKPIs, OverdueReturn
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=DashboardKPIs)
def get_kpis(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard KPI cards data.

    Returns counts for: Available, Allocated, Under Maintenance, Lost assets,
    Active Bookings, Pending Transfers, Overdue Returns, Maintenance Today, Total Assets.
    """
    kpis = DashboardService.get_kpis(db)
    return kpis


@router.get("/overdue-returns", response_model=list[OverdueReturn])
def get_overdue_returns(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all overdue asset returns.

    Assets past their Expected Return Date that are still Active.
    Highlighted separately on dashboard.
    """
    overdue = DashboardService.get_overdue_returns(db)
    return overdue


@router.get("/upcoming-returns", response_model=list[OverdueReturn])
def get_upcoming_returns(
    days: int = 7,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get allocations due for return in next N days (default 7).

    Shown separately from overdue returns on dashboard.
    """
    upcoming = DashboardService.get_upcoming_returns(db, days=days)
    return upcoming


@router.get("/quick-actions")
def get_quick_actions(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get quick action buttons based on user role.

    - Admin/Asset Manager: Register Asset, Allocate Asset, Book Resource, Raise Maintenance
    - Department Head: Book Resource, Raise Maintenance
    - Employee: Book Resource, Raise Maintenance
    """
    actions = DashboardService.get_quick_actions(current_user.role)
    return actions


@router.get("/full", response_model=DashboardResponse)
def get_full_dashboard(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete dashboard data in one call.

    Combines KPIs, overdue returns, upcoming returns, and quick actions.
    Used for initial dashboard load.
    """
    dashboard_data = DashboardService.get_full_dashboard(db, current_user)
    return dashboard_data


@router.get("/admin-overview")
def get_admin_overview(
    current_user: Employee = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Admin-only: Organization-wide analytics overview.

    Returns department-wise asset distribution, recent activity, etc.
    """
    # TODO: Add detailed admin analytics when Reports module is built
    kpis = DashboardService.get_kpis(db)
    return {
        "organization_kpis": kpis,
        "message": "Full admin analytics coming in Reports module"
    }
