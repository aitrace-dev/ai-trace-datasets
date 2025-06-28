from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.db.async_session import get_db_async
from ai_trace_datasets.core.dependencies.auth import get_current_user
from ai_trace_datasets.core.repositories import (
    feature_flags as feature_flags_repository,
)
from ai_trace_datasets.core.schemas.feature_flags import (
    FeatureFlagResponse,
    FeatureFlagUpdateRequest,
)
from ai_trace_datasets.core.schemas.user_auth import UserDto

router = APIRouter()


@router.get(
    "",
    response_model=List[FeatureFlagResponse],
    status_code=status.HTTP_200_OK,
)
async def get_feature_flags(
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
) -> List[FeatureFlagResponse]:
    """
    Get all feature flags.

    This endpoint requires authentication.

    Returns:
        List of feature flags
    """
    feature_flags = await feature_flags_repository.get_feature_flags_by_org_id(db, user.organization_id)
    return [FeatureFlagResponse.model_validate(flag) for flag in feature_flags]


@router.patch(
    "/{flag_name}",
    response_model=FeatureFlagResponse,
    status_code=status.HTTP_200_OK,
)
async def update_feature_flag(
    flag_name: str,
    update: FeatureFlagUpdateRequest,
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
) -> FeatureFlagResponse:
    """
    Enable or disable a feature flag by name.
    """
    updated_flag = await feature_flags_repository.set_feature_flag_enabled(
        db, flag_name, user.organization_id, update.enabled
    )
    if updated_flag is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404, detail=f"Feature flag '{flag_name}' not found"
        )
    return FeatureFlagResponse.model_validate(updated_flag)
