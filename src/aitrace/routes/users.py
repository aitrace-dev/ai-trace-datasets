"""User routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.database import get_db_session
from aitrace.common.dependencies import get_current_admin, get_current_user
from aitrace.models.base import PaginatedResponse
from aitrace.models.user import UserCreate, UserResponse, UserUpdate
from aitrace.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


class CreateUserResponse(BaseModel):
    """Create user response with temp password."""

    user: UserResponse
    temp_password: str


@router.get("", response_model=PaginatedResponse)
async def list_users(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: Annotated[UserResponse, Depends(get_current_admin)] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> PaginatedResponse:
    """
    List users (admin only).

    Args:
        page: Page number
        page_size: Items per page
        user: Current admin user
        db: Database session

    Returns:
        Paginated users
    """
    user_service = UserService(db)
    users, total = await user_service.get_by_team(user.team_id, page, page_size)

    return PaginatedResponse(
        items=users,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserResponse:
    """
    Get user by ID.

    Args:
        user_id: User ID
        user: Current user
        db: Database session

    Returns:
        User
    """
    user_service = UserService(db)
    return await user_service.get_by_id(user_id)


@router.post("", response_model=CreateUserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    user: Annotated[UserResponse, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CreateUserResponse:
    """
    Create user (admin only).

    Args:
        data: User create data
        user: Current admin user
        db: Database session

    Returns:
        Created user with temp password
    """
    user_service = UserService(db)
    created_user, temp_password = await user_service.create(data, user.team_id, user.id)

    return CreateUserResponse(user=created_user, temp_password=temp_password)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    user: Annotated[UserResponse, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserResponse:
    """
    Update user (admin only).

    Args:
        user_id: User ID
        data: Update data
        user: Current admin user
        db: Database session

    Returns:
        Updated user
    """
    user_service = UserService(db)
    return await user_service.update(user_id, data, user.id)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """
    Delete user (admin only).

    Args:
        user_id: User ID
        user: Current admin user
        db: Database session
    """
    user_service = UserService(db)
    await user_service.delete(user_id, user.id)


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    """
    Reset user password (admin only).

    Args:
        user_id: User ID
        user: Current admin user
        db: Database session

    Returns:
        New temp password
    """
    user_service = UserService(db)
    temp_password = await user_service.reset_user_password(user_id, user.id)

    return {"temp_password": temp_password}
