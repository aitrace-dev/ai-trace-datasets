from uuid import UUID

from pydantic import BaseModel


class FeatureFlagResponse(BaseModel):
    """Schema for feature flag response."""

    id: UUID
    name: str
    enabled: bool
    description: str | None = None

    class Config:
        from_attributes = True


class FeatureFlagUpdateRequest(BaseModel):
    """Schema for enabling/disabling a feature flag."""

    enabled: bool
