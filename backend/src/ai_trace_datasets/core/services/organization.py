from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.repositories.datasets import find_by_id_and_org_id
import ai_trace_datasets.core.repositories.organization_repository as organization_repository
from ai_trace_datasets.core.repositories.feature_flags import create_default_feature_flags


async def validate_dataset_belongs_to_organization(
        db: AsyncSession, dataset_id: str, organization_id: str
):
    dataset = await find_by_id_and_org_id(db, dataset_id, organization_id)
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID {dataset_id} not found",
        )


async def create_organization(db: AsyncSession, org_name: str) -> str:
    org_id = await organization_repository.create_organization(db, org_name)
    await create_default_feature_flags(db, org_id)
    return org_id
