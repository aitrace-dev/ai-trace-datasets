import uuid

from sqlalchemy import ARRAY, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ai_trace_datasets.core.models.base import Base


class UserModel(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    roles = Column(ARRAY(String), nullable=False)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship to organization
    organization = relationship("OrganizationModel", back_populates="users")
