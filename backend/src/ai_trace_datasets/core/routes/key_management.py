import secrets
from datetime import datetime
from uuid import UUID

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.db.async_session import get_db_async
from ai_trace_datasets.core.dependencies.auth import get_current_user
from ai_trace_datasets.core.models.key_management import APIKeyModel
from ai_trace_datasets.core.schemas.key_management import (
    APIKeyCreateResponse,
    APIKeyPreviewResponse,
)
from ai_trace_datasets.core.schemas.user_auth import UserDto

router = APIRouter()


# Utility to generate a secure API key
def generate_api_key():
    return "sk-" + secrets.token_urlsafe(32)


def get_api_key_preview(api_key: str) -> str:
    return api_key[:5] + "***"


@router.post("", response_model=APIKeyCreateResponse)
async def create_api_key(
    db: AsyncSession = Depends(get_db_async), user: UserDto = Depends(get_current_user)
):
    api_key = generate_api_key()
    # Convert string to bytes before hashing
    key_bytes = api_key.encode("utf-8")
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    key_hash = bcrypt.hashpw(key_bytes, salt).decode("utf-8")
    preview = get_api_key_preview(api_key)
    new_key = APIKeyModel(
        api_key_preview=preview,
        key_hash=key_hash,
        created_at=datetime.now(),
        organization_id=user.organization_id,
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)
    return APIKeyCreateResponse(
        api_key=api_key,
        id=new_key.id,
        api_key_preview=new_key.api_key_preview,
        created_at=new_key.created_at,
    )


@router.get("", response_model=list[APIKeyPreviewResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db_async), user: UserDto = Depends(get_current_user)
):
    smt = select(APIKeyModel).where(APIKeyModel.organization_id == user.organization_id)
    result = await db.execute(smt)
    keys = result.scalars().all()
    return [
        APIKeyPreviewResponse(
            id=k.id, api_key_preview=k.api_key_preview, created_at=k.created_at
        )
        for k in keys
    ]


@router.delete(
    "/delete/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_api_key(
    key_id: UUID,
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
):
    smt = select(APIKeyModel).where(
        APIKeyModel.id == key_id, APIKeyModel.organization_id == user.organization_id
    )
    result = await db.execute(smt)
    key = result.scalars().first()

    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    await db.delete(key)
