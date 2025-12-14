"""Team models."""

from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from aitrace.models.base import Base, TimestampMixin


class Team(Base, TimestampMixin):
    """Team SQLAlchemy model."""

    __tablename__ = "teams"
    __table_args__ = {'schema': 'aitrace'}

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)

    # Relationships
    users = relationship("User", back_populates="team")


class TeamBase(BaseModel):
    """Team base schema."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., max_length=100)


class TeamCreate(TeamBase):
    """Team create schema."""

    pass


class TeamResponse(TeamBase):
    """Team response schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime


class TeamUpdate(TeamBase):
    """Team update schema."""

    name: str | None = Field(None, max_length=100)
