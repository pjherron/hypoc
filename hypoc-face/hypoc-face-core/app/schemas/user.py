"""Pydantic schemas for API requests/responses."""

from __future__ import annotations  # Enable forward references
from pydantic import BaseModel, EmailStr
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from uuid import UUID

if TYPE_CHECKING:
    from app.schemas.role import RoleResponse

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    cognito_sub: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    cognito_sub: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserWithRoles(UserResponse):
    roles: List["RoleResponse"] = []
    
    model_config = {"from_attributes": True}

# Update forward references after all models are defined
from app.schemas.role import RoleResponse
UserWithRoles.model_rebuild()
