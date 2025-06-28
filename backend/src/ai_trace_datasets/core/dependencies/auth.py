import bcrypt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
    OAuth2PasswordBearer,
)
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.db.async_session import get_db_async
from ai_trace_datasets.core.models.key_management import APIKeyModel
from ai_trace_datasets.core.models.user import UserModel
from ai_trace_datasets.core.schemas.user_auth import UserDto
from ai_trace_datasets.core.settings.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
security = HTTPBearer()

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db_async)
) -> UserDto:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    stmt = select(UserModel).where(UserModel.id == user_id)
    user = await db.execute(stmt)
    user = user.scalars().first()

    if user is None:
        raise credentials_exception

    return UserDto(
        id=user.id,
        username=user.username,
        roles=user.roles,
        organization_id=str(user.organization_id),
    )


async def verify_client_auth(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db_async),
) -> UserDto:
    token = credentials.credentials

    try:
        user = await get_current_user(token, db)
        return UserDto(
            id=user.id,
            username=user.username,
            roles=user.roles,
            organization_id=str(user.organization_id),
        )
    except HTTPException:
        pass

    # API key validation
    if len(token) < 16:
        raise HTTPException(status_code=401, detail="Invalid API key format")

    preview = token[:16]
    preview = preview[:5] + "***"

    stmt = select(APIKeyModel).where(APIKeyModel.api_key_preview == preview)
    result = await db.execute(stmt)
    api_keys = result.scalars().all()

    for api_key_obj in api_keys:
        if bcrypt.checkpw(token.encode("utf-8"), api_key_obj.key_hash.encode("utf-8")):
            return UserDto(
                id=None,
                username="API KEY",
                roles=["api"],
                organization_id=str(api_key_obj.organization_id),
            )

    raise HTTPException(status_code=401, detail="API key invalid")
