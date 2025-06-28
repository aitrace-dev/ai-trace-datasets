from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ImageDto(BaseModel):
    url: str
    md5: str
    media_type: str


class ImageResponse(BaseModel):
    id: str
    name: str
    md5: str
    dataset_id: str
    source_url: Optional[str] = None
    labels: list[dict] | None
    is_labeled: bool
    is_queued: bool
    updated_by_username: Optional[str]
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
