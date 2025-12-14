"""Dataset row models."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import relationship

from aitrace.models.base import Base, TimestampMixin


class RowStatus(str, Enum):
    """Row status enum."""

    PENDING = "pending"
    REVIEWED = "reviewed"


class DatasetRow(Base, TimestampMixin):
    """Dataset row SQLAlchemy model."""

    __tablename__ = "dataset_rows"
    __table_args__ = {'schema': 'aitrace'}

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    dataset_id = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.datasets.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(Text, nullable=False)
    image_hash = Column(String(32), nullable=False)
    data = Column(JSONB, default={})
    status = Column(String(20), nullable=False, default="pending")
    created_by = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.users.id", ondelete="SET NULL"))
    updated_by = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.users.id", ondelete="SET NULL"))

    # Relationships
    dataset = relationship("Dataset", back_populates="rows")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])


class DatasetRowBase(BaseModel):
    """Dataset row base schema."""

    model_config = ConfigDict(from_attributes=True)

    image_url: str
    data: dict[str, Any] = Field(default_factory=dict)


class DatasetRowCreate(DatasetRowBase):
    """Dataset row create schema."""

    pass


class DatasetRowResponse(DatasetRowBase):
    """Dataset row response schema."""

    id: UUID
    dataset_id: UUID
    image_hash: str
    status: RowStatus
    created_by: UUID | None
    created_by_email: str | None = None
    created_at: datetime
    updated_by: UUID | None
    updated_by_email: str | None = None
    updated_at: datetime


class DatasetRowUpdate(BaseModel):
    """Dataset row update schema."""

    image_url: str | None = None
    data: dict[str, Any] | None = None
    status: RowStatus | None = None


class BulkUpdateStatusRequest(BaseModel):
    """Bulk update status request."""

    row_ids: list[UUID]
    status: RowStatus


class CSVImportRequest(BaseModel):
    """CSV import request."""

    file_content: str
    column_mapping: dict[str, str]  # CSV column name -> field_id
    mark_all_pending: bool = False


class CSVImportResponse(BaseModel):
    """CSV import response."""

    imported: int
    skipped_duplicates: int
    skipped_invalid: int
    errors: list[str] = []
