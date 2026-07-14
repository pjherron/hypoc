"""Application configuration."""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "postgresql://hypoc-face:changeme@localhost:5432/hypoc-face"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Authentication
    # Options: "none" (no auth), "cognito_mock" (JWT mock), "cognito" (real Cognito)
    AUTH_PROVIDER: str = "none"  # Default to no auth for easy testing
    COGNITO_USER_POOL_ID: str = ""
    COGNITO_REGION: str = "us-east-1"
    JWT_SECRET: str = "change-this-in-production-use-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    
    # CORS - can be string (comma-separated) or list
    CORS_ORIGINS: str = "http://localhost:8080,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS into a list."""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS
    
    # Logging
    LOG_LEVEL: str = "info"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
