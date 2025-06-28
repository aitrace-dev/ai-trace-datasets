import uuid

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ai_trace_datasets.core.models.base import Base


class OrganizationModel(Base):
    """
    Organization model representing a company or group that users belong to.

    Has a one-to-many relationship with users.
    """

    __tablename__ = "organizations"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    name = Column(String, nullable=False, unique=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship to users (one-to-many)
    users = relationship(
        "UserModel", back_populates="organization", cascade="all, delete-orphan"
    )
