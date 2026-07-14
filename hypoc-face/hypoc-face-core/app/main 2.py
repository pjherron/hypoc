"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import health, users, roles

app = FastAPI(
    title="Hypoc-Face Core API",
    description="Backend API for Project Hypoc-Face - Enterprise OpenCode Platform",
    version="0.1.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(roles.router, prefix="/api/v1/roles", tags=["roles"])

@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print(f"Starting Hypoc-Face Core API - Environment: {settings.ENVIRONMENT}")
    print(f"Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'Not configured'}")
    print(f"Redis: {settings.REDIS_URL}")

@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print("Shutting down Hypoc-Face Core API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
