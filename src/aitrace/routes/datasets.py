"""Dataset routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.database import get_db_session
from aitrace.common.dependencies import get_current_user
from aitrace.models.base import PaginatedResponse
from aitrace.models.dataset import DatasetCreate, DatasetResponse, DatasetUpdate
from aitrace.models.user import UserResponse
from aitrace.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("", response_model=PaginatedResponse)
async def list_datasets(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: Annotated[UserResponse, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> PaginatedResponse:
    """
    List datasets.

    Args:
        page: Page number
        page_size: Items per page
        user: Current user
        db: Database session

    Returns:
        Paginated datasets
    """
    dataset_service = DatasetService(db)
    datasets, total = await dataset_service.get_by_team(user.team_id, page, page_size)

    return PaginatedResponse(
        items=datasets,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DatasetResponse:
    """
    Get dataset by ID.

    Args:
        dataset_id: Dataset ID
        user: Current user
        db: Database session

    Returns:
        Dataset
    """
    dataset_service = DatasetService(db)
    return await dataset_service.get_by_id(dataset_id)


@router.post("", response_model=DatasetResponse, status_code=201)
async def create_dataset(
    data: DatasetCreate,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DatasetResponse:
    """
    Create dataset.

    Args:
        data: Dataset create data
        user: Current user
        db: Database session

    Returns:
        Created dataset
    """
    dataset_service = DatasetService(db)
    return await dataset_service.create(data, user.team_id, user.id)


@router.put("/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(
    dataset_id: UUID,
    data: DatasetUpdate,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DatasetResponse:
    """
    Update dataset.

    Args:
        dataset_id: Dataset ID
        data: Update data
        user: Current user
        db: Database session

    Returns:
        Updated dataset
    """
    dataset_service = DatasetService(db)
    return await dataset_service.update(dataset_id, data, user.id)


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(
    dataset_id: UUID,
    user: Annotated[UserResponse, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """
    Delete dataset.

    Args:
        dataset_id: Dataset ID
        user: Current user
        db: Database session
    """
    dataset_service = DatasetService(db)
    await dataset_service.delete(dataset_id)
