"""Schema models."""

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import relationship

from aitrace.models.base import Base, TimestampMixin


class FieldType(str, Enum):
    """Field type enum."""

    BOOLEAN = "boolean"
    ENUM = "enum"
    TEXT = "text"
    NUMERIC = "numeric"


class Schema(Base, TimestampMixin):
    """Schema SQLAlchemy model."""

    __tablename__ = "schemas"
    __table_args__ = {'schema': 'aitrace'}

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    team_id = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.teams.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.users.id", ondelete="SET NULL"))
    updated_by = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.users.id", ondelete="SET NULL"))

    # Relationships
    fields = relationship("SchemaField", back_populates="schema", cascade="all, delete-orphan", order_by="SchemaField.position")


class SchemaField(Base, TimestampMixin):
    """Schema field SQLAlchemy model."""

    __tablename__ = "schema_fields"
    __table_args__ = {'schema': 'aitrace'}

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    schema_id = Column(PGUUID(as_uuid=True), ForeignKey("aitrace.schemas.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    required = Column(Boolean, nullable=False, default=False)
    default_value = Column(Text)
    position = Column(Integer, nullable=False)
    config = Column(JSONB, default={})

    # Relationships
    schema = relationship("Schema", back_populates="fields")


class FieldConfig(BaseModel):
    """Field configuration schema."""

    model_config = ConfigDict(from_attributes=True)

    # Enum config
    options: list[str] | None = None

    # Text config
    max_length: int | None = None
    multiline: bool | None = None

    # Numeric config
    decimal: bool | None = None
    min: float | None = None
    max: float | None = None


class SchemaFieldBase(BaseModel):
    """Schema field base schema."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., max_length=100)
    type: FieldType
    required: bool = False
    default_value: str | None = None
    position: int
    config: FieldConfig = Field(default_factory=dict)


class SchemaFieldCreate(SchemaFieldBase):
    """Schema field create schema."""

    pass


class SchemaFieldResponse(SchemaFieldBase):
    """Schema field response schema."""

    id: UUID
    schema_id: UUID
    created_at: datetime
    updated_at: datetime


class SchemaBase(BaseModel):
    """Schema base schema."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., max_length=100)
    description: str | None = Field(None, max_length=500)


class SchemaCreate(SchemaBase):
    """Schema create schema."""

    fields: list[SchemaFieldCreate] = []
    copy_from_schema_id: UUID | None = None


class SchemaResponse(SchemaBase):
    """Schema response schema."""

    id: UUID
    team_id: UUID
    created_by: UUID | None
    created_at: datetime
    updated_by: UUID | None
    updated_at: datetime
    fields: list[SchemaFieldResponse] = []


class SchemaUpdate(BaseModel):
    """Schema update schema."""

    name: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=500)
    fields: list[SchemaFieldCreate] | None = None
