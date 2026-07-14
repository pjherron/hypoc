"""Role and Permission database models."""

from sqlalchemy import Column, String, Boolean, DateTime, Text, DECIMAL, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base

# Import user_roles table from user model
# NOTE: This is imported after Role is defined to avoid circular imports
# The actual import happens at module level after both classes are defined

# Association table for role-permissions many-to-many relationship
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', UUID(as_uuid=True), ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', DateTime, default=datetime.utcnow),
)

# Define user_roles here to avoid circular import
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('assigned_at', DateTime, default=datetime.utcnow),
)

class Role(Base):
    """Role model."""
    __tablename__ = 'roles'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    is_system_role = Column(Boolean, default=False)  # System roles can't be deleted
    quota_monthly_usd = Column(DECIMAL(10, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles", lazy="select")
    users = relationship("User", secondary=user_roles, back_populates="roles", lazy="select")
    
    def __repr__(self):
        return f"<Role {self.name}>"

class Permission(Base):
    """Permission model."""
    __tablename__ = 'permissions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)  # e.g., "model.use.premium"
    group_name = Column(String(50), nullable=False, index=True)  # e.g., "model"
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
    
    def __repr__(self):
        return f"<Permission {self.name}>"
