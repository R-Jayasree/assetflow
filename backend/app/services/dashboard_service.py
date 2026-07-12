"""Dashboard service - KPIs and overview data."""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, date

from app.models.asset import Asset, AssetStatus
from app.models.asset_allocation import AssetAllocation, AllocationStatus
from app.models.asset_transfer import AssetTransfer, TransferStatus
from app.models.booking import Booking, BookingStatus
from app.models.maintenance_request import MaintenanceRequest, MaintenanceStatus
from app.models.employee import Employee, UserRole


class DashboardService:
    @staticmethod
    def get_kpis(db: Session) -> dict:
        """Get all dashboard KPIs."""
        # Asset counts by status
        assets_available = db.query(Asset).filter(Asset.status == AssetStatus.AVAILABLE).count()
        assets_allocated = db.query(Asset).filter(Asset.status == AssetStatus.ALLOCATED).count()
        assets_under_maintenance = db.query(Asset).filter(Asset.status == AssetStatus.UNDER_MAINTENANCE).count()
        assets_lost = db.query(Asset).filter(Asset.status == AssetStatus.LOST).count()
        total_assets = db.query(Asset).count()

        # Active bookings
        active_bookings = db.query(Booking).filter(
            Booking.status.in_([BookingStatus.UPCOMING, BookingStatus.ONGOING])
        ).count()

        # Pending transfers
        pending_transfers = db.query(AssetTransfer).filter(
            AssetTransfer.status == TransferStatus.REQUESTED
        ).count()

        # Overdue returns
        overdue_returns = db.query(AssetAllocation).filter(
            and_(
                AssetAllocation.status == AllocationStatus.ACTIVE,
                AssetAllocation.expected_return_date < date.today()
            )
        ).count()

        # Maintenance today (requested today and in active status)
        maintenance_today = db.query(MaintenanceRequest).filter(
            and_(
                MaintenanceRequest.status.in_([
                    MaintenanceStatus.PENDING,
                    MaintenanceStatus.APPROVED,
                    MaintenanceStatus.TECHNICIAN_ASSIGNED,
                    MaintenanceStatus.IN_PROGRESS
                ]),
                func.date(MaintenanceRequest.requested_at) == date.today()
            )
        ).count()

        return {
            "assets_available": assets_available,
            "assets_allocated": assets_allocated,
            "assets_under_maintenance": assets_under_maintenance,
            "assets_lost": assets_lost,
            "active_bookings": active_bookings,
            "pending_transfers": pending_transfers,
            "overdue_returns": overdue_returns,
            "maintenance_today": maintenance_today,
            "total_assets": total_assets
        }

    @staticmethod
    def get_overdue_returns(db: Session) -> list:
        """Get all overdue asset allocations."""
        from app.core.database import engine
        from sqlalchemy import text

        query = text("""
            SELECT a.asset_id, a.asset_tag, a.asset_name, a.status AS asset_status, 
                   a.current_condition, al.allocation_id, al.allocated_to_employee_id,
                   CONCAT(e.first_name, ' ', e.last_name) AS holder_name, e.email AS holder_email,
                   al.allocated_to_department_id, d.department_name, al.allocation_date,
                   al.expected_return_date, al.status AS allocation_status,
                   CASE WHEN al.expected_return_date < CURDATE() AND al.status = 'Active' THEN 1 ELSE 0 END AS is_overdue
            FROM assets a
            LEFT JOIN asset_allocations al ON a.asset_id = al.asset_id AND al.status = 'Active'
            LEFT JOIN employees e ON al.allocated_to_employee_id = e.employee_id
            LEFT JOIN departments d ON al.allocated_to_department_id = d.department_id
            WHERE al.status = 'Active' AND al.expected_return_date < CURDATE()
            ORDER BY al.expected_return_date ASC
        """)

        result = db.execute(query)
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    @staticmethod
    def get_upcoming_returns(db: Session, days: int = 7) -> list:
        """Get allocations due for return in next N days."""
        from sqlalchemy import text

        query = text("""
            SELECT a.asset_id, a.asset_tag, a.asset_name, a.status AS asset_status, 
                   a.current_condition, al.allocation_id, al.allocated_to_employee_id,
                   CONCAT(e.first_name, ' ', e.last_name) AS holder_name, e.email AS holder_email,
                   al.allocated_to_department_id, d.department_name, al.allocation_date,
                   al.expected_return_date, al.status AS allocation_status,
                   CASE WHEN al.expected_return_date < CURDATE() AND al.status = 'Active' THEN 1 ELSE 0 END AS is_overdue
            FROM assets a
            LEFT JOIN asset_allocations al ON a.asset_id = al.asset_id AND al.status = 'Active'
            LEFT JOIN employees e ON al.allocated_to_employee_id = e.employee_id
            LEFT JOIN departments d ON al.allocated_to_department_id = d.department_id
            WHERE al.status = 'Active' 
              AND al.expected_return_date >= CURDATE()
              AND al.expected_return_date <= DATE_ADD(CURDATE(), INTERVAL :days DAY)
            ORDER BY al.expected_return_date ASC
        """)

        result = db.execute(query, {"days": days})
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    @staticmethod
    def get_quick_actions(user_role: UserRole) -> list:
        """Get quick actions based on user role."""
        actions = []

        # Register Asset - Asset_Manager and Admin
        if user_role in [UserRole.ADMIN, UserRole.ASSET_MANAGER]:
            actions.append({
                "action_id": "register_asset",
                "label": "Register Asset",
                "icon": "PlusCircle",
                "route": "/assets/register",
                "allowed_roles": ["Admin", "Asset_Manager"]
            })

        # Book Resource - All roles
        actions.append({
            "action_id": "book_resource",
            "label": "Book Resource",
            "icon": "Calendar",
            "route": "/bookings/new",
            "allowed_roles": ["Admin", "Asset_Manager", "Department_Head", "Employee"]
        })

        # Raise Maintenance - All roles (employees who have assets)
        actions.append({
            "action_id": "raise_maintenance",
            "label": "Raise Maintenance",
            "icon": "Wrench",
            "route": "/maintenance/new",
            "allowed_roles": ["Admin", "Asset_Manager", "Department_Head", "Employee"]
        })

        # Allocate Asset - Asset_Manager and Admin
        if user_role in [UserRole.ADMIN, UserRole.ASSET_MANAGER]:
            actions.append({
                "action_id": "allocate_asset",
                "label": "Allocate Asset",
                "icon": "ArrowRightLeft",
                "route": "/allocations/new",
                "allowed_roles": ["Admin", "Asset_Manager"]
            })

        return actions

    @staticmethod
    def get_full_dashboard(db: Session, user: Employee) -> dict:
        """Get complete dashboard data for a user."""
        kpis = DashboardService.get_kpis(db)
        overdue = DashboardService.get_overdue_returns(db)
        upcoming = DashboardService.get_upcoming_returns(db, days=7)
        actions = DashboardService.get_quick_actions(user.role)

        return {
            "kpis": kpis,
            "overdue_returns": overdue,
            "upcoming_returns": upcoming,
            "quick_actions": actions,
            "recent_notifications": []  # Will be populated when notifications module is built
        }
