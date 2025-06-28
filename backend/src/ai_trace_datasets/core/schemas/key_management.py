from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class APIKeyPreviewResponse(BaseModel):
    id: UUID | str
    api_key_preview: str
    created_at: datetime


class APIKeyCreateResponse(BaseModel):
    id: UUID | str
    api_key: str
    api_key_preview: str
    created_at: datetime
