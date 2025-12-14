"""User models."""

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from aitrace.models.base import Base, TimestampMixin


class UserRole(str, Enum):
    """User role enum."""

    ADMIN = "admin"
    USER = "user"


class User(Base, TimestampMixin):
    """User SQLAlchemy model."""

    __tablename__ = "users"
    __table_args__ = {'schema': 'aitrace'}

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    team_id = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.teams.id", ondelete="CASCADE"), nullable=False)
    must_reset_pwd = Column(Boolean, nullable=False, default=True)

    # Relationships
    team = relationship("Team", back_populates="users")


class UserBase(BaseModel):
    """User base schema."""

    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    role: UserRole


class UserCreate(UserBase):
    """User create schema."""

    password: str = Field(..., min_length=8, max_length=128)


class UserResponse(UserBase):
    """User response schema."""

    id: UUID
    team_id: UUID
    must_reset_pwd: bool
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    """User update schema."""

    role: UserRole | None = None


class ChangePasswordRequest(BaseModel):
    """Change password request."""

    old_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ResetPasswordRequest(BaseModel):
    """Reset password request."""

    new_password: str = Field(..., min_length=8, max_length=128)
