from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.db.async_session import get_db_async
from ai_trace_datasets.core.dependencies.role_check import require_admin
from ai_trace_datasets.core.repositories import organization_repository, user_repository
from ai_trace_datasets.core.schemas.admin_users import (
    UserCreateRequest,
    UserPasswordUpdateRequest,
    UserResponse,
)
from ai_trace_datasets.core.schemas.user_auth import UserDto

router = APIRouter()


@router.get(
    "", response_model=list[UserResponse], dependencies=[]
)
async def list_users(
        db: AsyncSession = Depends(get_db_async),
        user: UserDto = Depends(require_admin),
):
    """
    List all users.
    Only accessible to users with admin role.
    """
    users = await user_repository.list_users_by_org_id(db, str(user.organization_id))
    return users


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_user(
        user_data: UserCreateRequest,
        db: AsyncSession = Depends(get_db_async),
):
    """
    Create a new user.
    Only accessible to users with admin role.

    If no organization_id is provided, the default organization will be used.
    """
    org_id = await organization_repository.get_default_organization(db)
    new_user = await user_repository.create_user(
        db,
        username=user_data.username,
        password=user_data.password,
        roles=user_data.roles,
        organization_id=org_id,
    )
    return new_user


@router.put("/{user_id}/password", dependencies=[])
async def update_user_password(
        user_id: UUID,
        password_data: UserPasswordUpdateRequest,
        db: AsyncSession = Depends(get_db_async),
        existing_user: UserDto = Depends(require_admin),
):
    """
    Update a user's password.
    Only accessible to users with admin role.
    """
    user = await user_repository.get_user(db, user_id)
    if not user or not str(user.organization_id) == str(existing_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    await user_repository.update_password(db, user_id, password_data.password)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_user(
        user_id: UUID,
        db: AsyncSession = Depends(get_db_async),
        existing_user: UserDto = Depends(require_admin),
):
    user = await user_repository.get_user(db, user_id)
    if not user or not str(user.organization_id) == str(existing_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    success = await user_repository.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user",
        )
