import uuid

from sqlalchemy import JSON, Column, DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from ai_trace_datasets.core.models.base import Base


class TestRunModel(Base):
    __tablename__ = "test_runs"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    dataset_id = Column(UUID(as_uuid=True), nullable=False)
    description = Column(String, nullable=True)
    run_start_time = Column(DateTime(timezone=True), nullable=False)
    run_end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(
        String, nullable=False
    )  # "running", "completed", "stopped", "error"
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    n_test_cases = Column(Integer, nullable=False)
    extra_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
