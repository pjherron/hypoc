"""Pydantic schemas for roles and permissions."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class PermissionBase(BaseModel):
    name: str
    group_name: str
    display_name: str
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class PermissionResponse(PermissionBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    quota_monthly_usd: Optional[Decimal] = Decimal("0")

class RoleCreate(RoleBase):
    permission_ids: List[UUID] = []

class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    quota_monthly_usd: Optional[Decimal] = None
    permission_ids: Optional[List[UUID]] = None

class RoleResponse(RoleBase):
    id: UUID
    is_system_role: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RoleWithPermissions(RoleResponse):
    permissions: List[PermissionResponse] = []
