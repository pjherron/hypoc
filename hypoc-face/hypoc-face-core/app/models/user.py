"""User database model."""

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base
# Import user_roles from role.py to avoid duplication
from app.models.role import user_roles

class User(Base):
    """User model."""
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    cognito_sub = Column(String(255), unique=True, index=True)  # Cognito user ID
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users", lazy="select")
    
    def __repr__(self):
        return f"<User {self.email}>"
