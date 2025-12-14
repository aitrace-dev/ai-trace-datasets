"""First-time setup routes."""

from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.database import get_db_session
from aitrace.models.team import TeamCreate
from aitrace.models.user import User
from aitrace.repositories.user_repository import UserRepository
from aitrace.services.auth_service import AuthService
from aitrace.services.team_service import TeamService

router = APIRouter(prefix="/setup", tags=["setup"])


class SetupRequest(BaseModel):
    """Setup request."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class SetupResponse(BaseModel):
    """Setup response."""

    message: str
    team_id: str
    user_id: str


@router.get("/check")
async def check_setup(
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, bool]:
    """
    Check if setup is needed.

    Args:
        db: Database session

    Returns:
        Whether setup is needed
    """
    team_service = TeamService(db)
    needs_setup = not await team_service.exists_any()

    return {"needs_setup": needs_setup}


@router.post("/init", response_model=SetupResponse)
async def initialize_setup(
    data: SetupRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> SetupResponse:
    """
    Initialize application with first admin user.

    Args:
        data: Setup data
        response: FastAPI response
        db: Database session

    Returns:
        Setup response
    """
    # Check if setup already done
    team_service = TeamService(db)
    if await team_service.exists_any():
        raise HTTPException(status_code=400, detail="Setup already completed")

    # Create team (this will also create the default Boolean Template schema)
    team_data = TeamCreate(name="My Team")
    team_response = await team_service.create(team_data)

    # Create admin user
    auth_service = AuthService(db)
    user_repo = UserRepository(db)

    user = User(
        id=uuid4(),
        email=data.email.lower(),
        password_hash=auth_service.hash_password(data.password),
        role="admin",
        team_id=team_response.id,
        must_reset_pwd=False,  # First admin doesn't need to reset
    )

    user = await user_repo.create(user)

    # Create and set token
    token = auth_service.create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=24 * 60 * 60,
    )

    await db.commit()

    return SetupResponse(
        message="Setup completed successfully",
        team_id=str(team_response.id),
        user_id=str(user.id),
    )
