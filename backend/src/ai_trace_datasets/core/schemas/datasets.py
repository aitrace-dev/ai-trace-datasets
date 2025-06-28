from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class CreateDatasetRequest(BaseModel):
    name: str
    description: str


class DatasetResponse(BaseModel):
    id: str
    name: str
    description: str
    labels: list[dict] | None
    n_images: int
    n_labeled_images: int
    n_queued_images: int
    created_at: datetime
    updated_at: datetime


class LabelCreationRequest(BaseModel):
    name: str
    type: Literal["boolean", "category"]
    description: str
    possible_values: list[str]


class LabelUpdateRequest(BaseModel):
    name: str
    value: bool | str


class ImageUpdateRequest(BaseModel):
    name: Optional[str] = None
    comment: Optional[str] = None
    labels: list[LabelUpdateRequest] | None = None
    is_labeled: Optional[bool] = None


class UpdateDatasetRequest(BaseModel):
    name: str = None
    description: str = None
    labels: list[LabelCreationRequest]


class ImportImageRequest(BaseModel):
    url: str
    name: str | None
    description: str | None
    labels: list[LabelUpdateRequest] | None
    is_labeled: bool | None


class TestRunResponse(BaseModel):
    id: str
    description: str | None
    run_start_time: datetime
    run_end_time: datetime
    status: Literal["running", "completed", "stopped", "error"]
    precision: float | None
    n_test_cases: int
    extra_metrics: dict[str, float | int | str]
    recall: float | None
    accuracy: float | None
    f1_score: float | None


class TestRunRequest(BaseModel):
    description: str | None
    run_start_time: datetime
    run_end_time: datetime
    status: Literal["running", "completed", "stopped", "error"]
    precision: float | None
    recall: float | None
    accuracy: float | None
    f1_score: float | None
    n_test_cases: int
    extra_metrics: dict[str, float | int | str]
