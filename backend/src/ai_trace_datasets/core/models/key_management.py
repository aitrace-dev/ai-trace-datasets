import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ai_trace_datasets.core.models.base import Base


class APIKeyModel(Base):
    __tablename__ = "api_keys"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    api_key_preview = Column(String(16), nullable=False)
    key_hash = Column(String(128), nullable=False)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
