"""AssetFlow FastAPI Application Entry Point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import auth, dashboard
from app.core.database import engine, Base

# Create all tables (for development; use Alembic in production)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AssetFlow API",
    description="Enterprise Asset & Resource Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """API health check."""
    return {
        "message": "AssetFlow API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "assetflow-api"}


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

# TODO: Add remaining routers as modules are built
# app.include_router(employees.router, prefix="/api/v1")
# app.include_router(departments.router, prefix="/api/v1")
# app.include_router(assets.router, prefix="/api/v1")
# app.include_router(allocations.router, prefix="/api/v1")
# app.include_router(transfers.router, prefix="/api/v1")
# app.include_router(bookings.router, prefix="/api/v1")
# app.include_router(maintenance.router, prefix="/api/v1")
# app.include_router(audits.router, prefix="/api/v1")
# app.include_router(notifications.router, prefix="/api/v1")
# app.include_router(reports.router, prefix="/api/v1")
