import uuid

import aiohttp
from fastapi import APIRouter, Request, HTTPException

import ai_trace_datasets.core.services.organization as organization_service
from ai_trace_datasets.core.db.async_session import AsyncSessionLocal
from ai_trace_datasets.core.repositories.user_repository import get_user_by_username, create_user
from ai_trace_datasets.core.routes.user_auth import create_access_token, TokenResponse
from ai_trace_datasets.core.schemas.user_auth import UserDto
from ai_trace_datasets.core.settings.config import settings

RESPONSE_CACHE = {}

router = APIRouter()


async def validate_auth0_token(token: str):
    if token in RESPONSE_CACHE:
        return RESPONSE_CACHE[token]
    async with aiohttp.ClientSession() as session:
        async with session.get(
                f"https://{settings.AUTH0_DOMAIN}/userinfo",
                headers={"Authorization": f"Bearer {token}"},
        ) as resp:
            if resp.status != 200:
                return None
            userinfo = await resp.json()
            RESPONSE_CACHE[token] = userinfo
            return userinfo


@router.post("/exchange-token", response_model=TokenResponse)
async def exchange_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Auth0 token")
    token = auth_header.split("Bearer ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Missing Auth0 token")

    # Validate token using local function
    userinfo = await validate_auth0_token(token)
    if not userinfo:
        raise HTTPException(status_code=401, detail="Invalid Auth0 token")

    async with AsyncSessionLocal() as db:
        username = userinfo.get("email")
        user = await get_user_by_username(db, username)
        if not user:
            org_name = f"Org-{uuid.uuid4().hex[:8]}"

            org_id = await organization_service.create_organization(db, org_name)
            user = await create_user(
                db,
                username=username,
                password=uuid.uuid4().hex,  # random password
                roles=["user"],
                organization_id=org_id,
            )
        user_dto = UserDto(
            id=user.id,
            username=user.username,
            roles=user.roles,
            organization_id=str(user.organization_id),
        )

    access_token = create_access_token({
        "sub": str(user_dto.id),
        "username": user_dto.username,
        "roles": user_dto.roles,
        "organization_id": str(user_dto.organization_id),
    })
    return TokenResponse(access_token=access_token)
