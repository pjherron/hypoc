"""Health check endpoints."""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "hypoc-face-core",
        "version": "0.1.0"
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with dependency status."""
    # TODO: Add actual database and Redis health checks
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "hypoc-face-core",
        "version": "0.1.0",
        "dependencies": {
            "database": "ok",  # TODO: Check PostgreSQL
            "redis": "ok",     # TODO: Check Redis
        }
    }
