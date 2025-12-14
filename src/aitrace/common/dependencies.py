"""FastAPI dependencies."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, Request
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.database import get_db_session
from aitrace.common.exceptions import UnauthorizedException
from aitrace.common.settings import settings
from aitrace.models.user import User as UserModel


async def get_current_user(
    request: Request,
    access_token: Annotated[str | None, Cookie()] = None,
    db: AsyncSession = Depends(get_db_session),
) -> UserModel:
    """
    Get current authenticated user from JWT cookie.

    Args:
        request: FastAPI request
        access_token: JWT token from cookie
        db: Database session

    Returns:
        Current user

    Raises:
        UnauthorizedException: If not authenticated or token invalid
    """
    if not access_token:
        raise UnauthorizedException("Not authenticated")

    try:
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str | None = payload.get("sub")
        exp: int | None = payload.get("exp")

        if user_id is None or exp is None:
            raise UnauthorizedException("Invalid token")

        # Check expiration
        if datetime.utcnow().timestamp() > exp:
            raise UnauthorizedException("Token expired")

        # Get user from database
        result = await db.execute(select(UserModel).where(UserModel.id == UUID(user_id)))
        user = result.scalar_one_or_none()

        if user is None:
            raise UnauthorizedException("User not found")

        return user

    except JWTError:
        raise UnauthorizedException("Invalid token")


async def get_current_admin(
    user: UserModel = Depends(get_current_user),
) -> UserModel:
    """
    Get current authenticated admin user.

    Args:
        user: Current user

    Returns:
        Current admin user

    Raises:
        UnauthorizedException: If user is not admin
    """
    if user.role != "admin":
        raise UnauthorizedException("Admin access required")

    return user


def get_db_dependency() -> AsyncSession:
    """Get database session dependency."""
    return Depends(get_db_session)
