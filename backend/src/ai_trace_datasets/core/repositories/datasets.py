import uuid
from typing import Sequence

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.models.dataset import DatasetModel


async def find_by_id_and_org_id(
    db: AsyncSession, dataset_id: str, organization_id: str
) -> DatasetModel | None:
    try:
        dataset_uuid = uuid.UUID(dataset_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid dataset ID format",
        )

    smt = select(DatasetModel).where(
        DatasetModel.id == dataset_uuid, DatasetModel.organization_id == organization_id
    )
    result = await db.execute(smt)
    return result.scalars().first()


async def increase_img_count(dataset_id: str, db, n_total=0, n_labeled=0):
    """
    Update image counts for a dataset.

    Args:
        dataset_id: The ID of the dataset to update
        db: Database session
        n_total: Change in total image count
        n_labeled: Change in labeled image count
    """
    smt = select(DatasetModel).where(DatasetModel.id == dataset_id)
    result = await db.execute(smt)
    dataset = result.scalars().first()
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID {dataset_id} not found",
        )

    # Update total and labeled image counts
    dataset.n_images += n_total
    dataset.n_labeled_images += n_labeled


async def find_all(
    db: AsyncSession, name: str | None, organization_id: str | uuid.UUID
) -> Sequence[DatasetModel]:
    smt = select(DatasetModel).where(DatasetModel.organization_id == organization_id)

    # Apply name filter if provided
    if name:
        smt = smt.where(DatasetModel.name.ilike(f"%{name}%"))

    smt = smt.order_by(DatasetModel.updated_at.desc())
    result = await db.execute(smt)
    return result.scalars().all()
