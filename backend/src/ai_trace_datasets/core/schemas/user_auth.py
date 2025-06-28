from typing import List
from uuid import UUID

from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserDto(BaseModel):
    id: UUID | str | None
    username: str
    roles: List[str]
    organization_id: str
