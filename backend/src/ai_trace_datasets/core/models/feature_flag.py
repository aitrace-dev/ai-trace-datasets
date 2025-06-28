import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ai_trace_datasets.core.models.base import Base

FEATURE_FLAG_AI_NAME_BY_URL = "ai_name_creation"


class FeatureFlagModel(Base):
    __tablename__ = "feature_flags"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    name = Column(String, nullable=False)
    enabled = Column(Boolean, nullable=False, default=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("name", "organization_id", name="uq_feature_flag_name_org"),
    )
