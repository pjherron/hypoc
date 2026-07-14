"""Role API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import require_permission
from app.models.role import Role, Permission
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse, RoleWithPermissions, PermissionResponse

router = APIRouter()

@router.get("", response_model=List[RoleWithPermissions])
async def list_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all roles."""
    roles = db.query(Role).offset(skip).limit(limit).all()
    return roles

@router.get("/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    role_id: str,
    db: Session = Depends(get_db)
):
    """Get role by ID."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role

@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    current_user: dict = Depends(require_permission("admin.roles.create")),
    db: Session = Depends(get_db)
):
    """Create new role (admin only)."""
    # Check if role already exists
    existing_role = db.query(Role).filter(Role.name == role_data.name).first()
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists"
        )
    
    # Create role
    role_dict = role_data.dict()
    permission_ids = role_dict.pop("permission_ids", [])
    
    role = Role(**role_dict)
    
    # Add permissions
    if permission_ids:
        permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        role.permissions = permissions
    
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    current_user: dict = Depends(require_permission("admin.roles.update")),
    db: Session = Depends(get_db)
):
    """Update role (admin only)."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify system roles"
        )
    
    update_dict = role_data.dict(exclude_unset=True)
    permission_ids = update_dict.pop("permission_ids", None)
    
    # Update basic fields
    for field, value in update_dict.items():
        setattr(role, field, value)
    
    # Update permissions if provided
    if permission_ids is not None:
        permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        role.permissions = permissions
    
    db.commit()
    db.refresh(role)
    return role

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: str,
    current_user: dict = Depends(require_permission("admin.roles.delete")),
    db: Session = Depends(get_db)
):
    """Delete role (admin only, custom roles only)."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system roles"
        )
    
    db.delete(role)
    db.commit()
    return None

@router.get("/permissions/all", response_model=List[PermissionResponse])
async def list_permissions(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    """List all available permissions."""
    permissions = db.query(Permission).offset(skip).limit(limit).all()
    return permissions
