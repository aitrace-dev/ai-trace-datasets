from typing import List
from uuid import UUID

from pydantic import BaseModel, Field, validator


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str
    roles: List[str] = ["user"]

    @validator("roles")
    def validate_roles(cls, v):
        allowed_roles = {"admin", "user"}
        if not all(role in allowed_roles for role in v):
            raise ValueError(f"Each role must be one of {allowed_roles}")
        return v


class UserPasswordUpdateRequest(BaseModel):
    password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: UUID
    username: str
    roles: List[str]
    organization_id: UUID

    class Config:
        from_attributes = True
