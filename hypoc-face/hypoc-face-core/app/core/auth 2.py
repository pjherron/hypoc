"""Authentication system with multiple modes for flexible development and production use."""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer(auto_error=False)  # Don't auto-error when no token provided

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Get current authenticated user based on AUTH_PROVIDER setting.
    
    Supports three modes:
    - 'none': No authentication (returns mock admin user)
    - 'cognito_mock': Mock JWT validation (for local dev)
    - 'cognito': Real AWS Cognito (for production)
    """
    
    # Mode 1: No authentication - return mock admin user for testing
    if settings.AUTH_PROVIDER == "none":
        return {
            "id": "test-user-id",
            "email": "admin@test.local",
            "name": "Test Admin",
            "roles": ["super_admin"],
            "auth_mode": "none"
        }
    
    # Mode 2 & 3: JWT-based authentication (cognito_mock or cognito)
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    if settings.AUTH_PROVIDER == "cognito_mock":
        # Mock Cognito - just decode JWT
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        
        return {
            "id": user_id,
            "email": payload.get("email"),
            "name": payload.get("name"),
            "roles": payload.get("roles", []),
            "auth_mode": "cognito_mock"
        }
    
    elif settings.AUTH_PROVIDER == "cognito":
        # Real AWS Cognito - validate against Cognito
        # TODO: Implement actual Cognito validation
        # For now, just decode
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        
        # In production, fetch user from database using cognito_sub
        return {
            "id": user_id,
            "email": payload.get("email"),
            "name": payload.get("name"),
            "roles": payload.get("roles", []),
            "auth_mode": "cognito"
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invalid AUTH_PROVIDER: {settings.AUTH_PROVIDER}"
        )

def require_permission(permission: str):
    """Decorator to check if user has required permission.
    
    In 'none' mode, all permissions are granted.
    In 'cognito_mock' and 'cognito' modes, checks against database (TODO).
    """
    async def permission_checker(current_user: dict = Depends(get_current_user)) -> dict:
        # If auth is disabled, grant all permissions
        if settings.AUTH_PROVIDER == "none":
            return current_user
        
        # TODO: Implement actual permission check against database
        # For now, allow all authenticated users
        return current_user
    return permission_checker
