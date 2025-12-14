"""Authentication routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.database import get_db_session
from aitrace.common.dependencies import get_current_user
from aitrace.models.user import ChangePasswordRequest, ResetPasswordRequest, UserResponse
from aitrace.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    """Login request."""

    email: EmailStr
    password: str
    remember_me: bool = False


class LoginResponse(BaseModel):
    """Login response."""

    user: UserResponse
    must_reset_pwd: bool


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LoginResponse:
    """
    Login user.

    Args:
        data: Login credentials
        response: FastAPI response
        db: Database session

    Returns:
        User and token
    """
    auth_service = AuthService(db)

    user, token = await auth_service.login(data.email, data.password, data.remember_me)

    # Set HTTP-only cookie
    max_age = 7 * 24 * 60 * 60 if data.remember_me else 24 * 60 * 60
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,  # HTTPS only in production
        samesite="strict",
        max_age=max_age,
    )

    return LoginResponse(
        user=UserResponse.model_validate(user),
        must_reset_pwd=user.must_reset_pwd,
    )


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    """
    Logout user.

    Args:
        response: FastAPI response

    Returns:
        Success message
    """
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    user: Annotated[UserResponse, Depends(get_current_user)],
) -> UserResponse:
    """
    Get current user.

    Args:
        user: Current user from dependency

    Returns:
        Current user
    """
    return UserResponse.model_validate(user)


@router.put("/password")
async def change_password(
    data: ChangePasswordRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    """
    Change password.

    Args:
        data: Change password request
        user: Current user
        db: Database session

    Returns:
        Success message
    """
    auth_service = AuthService(db)
    await auth_service.change_password(user.id, data.old_password, data.new_password)

    return {"message": "Password changed successfully"}


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    """
    Reset password (for first login).

    Args:
        data: Reset password request
        user: Current user
        db: Database session

    Returns:
        Success message
    """
    auth_service = AuthService(db)
    await auth_service.reset_password(user.id, data.new_password)

    return {"message": "Password reset successfully"}
