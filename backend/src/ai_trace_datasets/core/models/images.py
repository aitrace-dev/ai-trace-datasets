import uuid

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from ai_trace_datasets.core.models.base import Base


class ImageModel(Base):
    __tablename__ = "images"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    md5 = Column(String, nullable=False)
    description = Column(String, nullable=True)
    dataset_id = Column(UUID(as_uuid=True), nullable=False)
    labels = Column(JSONB, nullable=True)
    is_labeled = Column(Boolean, nullable=False, default=False)
    updated_by_username = Column(String, nullable=True)
    comment = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def is_queued(self) -> bool:
        """
        An image is considered to be in queue if it's not labeled.
        This is a calculated property that replaces the database column.
        """
        return not self.is_labeled
