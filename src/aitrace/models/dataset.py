"""Dataset models."""

from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from aitrace.models.base import Base, TimestampMixin


class Dataset(Base, TimestampMixin):
    """Dataset SQLAlchemy model."""

    __tablename__ = "datasets"
    __table_args__ = {'schema': 'aitrace'}

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    schema_id = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.schemas.id", ondelete="RESTRICT"), nullable=False)
    team_id = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.teams.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.users.id", ondelete="SET NULL"))
    updated_by = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.users.id", ondelete="SET NULL"))

    # Relationships
    schema = relationship("Schema")
    rows = relationship("DatasetRow", back_populates="dataset", cascade="all, delete-orphan")


class DatasetBase(BaseModel):
    """Dataset base schema."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., max_length=100)
    description: str | None = Field(None, max_length=500)


class DatasetCreate(DatasetBase):
    """Dataset create schema."""

    schema_id: UUID


class DatasetResponse(DatasetBase):
    """Dataset response schema."""

    id: UUID
    schema_id: UUID
    team_id: UUID
    created_by: UUID | None
    created_at: datetime
    updated_by: UUID | None
    updated_at: datetime
    rows_count: int = 0
    pending_count: int = 0


class DatasetUpdate(BaseModel):
    """Dataset update schema."""

    name: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=500)
