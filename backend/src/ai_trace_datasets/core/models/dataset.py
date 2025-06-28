import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from ai_trace_datasets.core.models.base import Base


class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    labels = Column(JSONB, nullable=True)
    n_images = Column(Integer, nullable=False, default=0)
    n_labeled_images = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def n_queued_images(self) -> int:
        """
        Calculate the number of queued images as the difference between total images and labeled images.
        This is a calculated property that replaces the database column.
        """
        return self.n_images - self.n_labeled_images
