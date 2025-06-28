import uuid
from datetime import datetime
from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import ai_trace_datasets.core.repositories.datasets as datasets_repository
from ai_trace_datasets.core.db.async_session import get_db_async
from ai_trace_datasets.core.dependencies.auth import (
    get_current_user,
    verify_client_auth,
)
from ai_trace_datasets.core.mappers.image_mapper import map_dataset_model_to_response
from ai_trace_datasets.core.models.dataset import DatasetModel
from ai_trace_datasets.core.models.images import ImageModel
from ai_trace_datasets.core.repositories.datasets import find_by_id_and_org_id
from ai_trace_datasets.core.schemas.dataset_schema import DatasetSchemaResponse
from ai_trace_datasets.core.schemas.datasets import (
    CreateDatasetRequest,
    DatasetResponse,
    UpdateDatasetRequest,
)
from ai_trace_datasets.core.schemas.user_auth import UserDto
from ai_trace_datasets.core.services import dataset_export
from ai_trace_datasets.core.storage.storage_provider import images_storage
import ai_trace_datasets.core.services.dataset_schemas as dataset_schemas_service

router = APIRouter()


@router.get("/schemas", tags=["datasets"], dependencies=[Depends(get_current_user)])
async def get_dataset_schemas() -> list[DatasetSchemaResponse]:
    return await dataset_schemas_service.get_default_schemas()


@router.post(
    "",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["datasets"],
)
async def create_dataset(
        request: CreateDatasetRequest,
        db: AsyncSession = Depends(get_db_async),
        user: UserDto = Depends(get_current_user),
):
    dataset = DatasetModel(
        id=str(uuid.uuid4()),
        name=request.name,
        description=request.description,
        labels=[
            {
                "name": "match",
                "type": "boolean",
                "description": "",
                "possible_values": [],
            }
        ],
        organization_id=user.organization_id,
        n_images=0,
        n_labeled_images=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)

    return map_dataset_model_to_response(dataset)


@router.get(
    "",
    response_model=List[DatasetResponse],
    tags=["datasets"],
)
async def list_datasets(
        name: str = None,
        db: AsyncSession = Depends(get_db_async),
        user: UserDto = Depends(verify_client_auth),
):
    models = await datasets_repository.find_all(db, name, user.organization_id)
    return [map_dataset_model_to_response(dataset) for dataset in models]


@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse,
    tags=["datasets"],
)
async def get_dataset(
        dataset_id: str,
        db: AsyncSession = Depends(get_db_async),
        user: UserDto = Depends(get_current_user),
):
    dataset = await find_by_id_and_org_id(db, dataset_id, user.organization_id)
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID {dataset_id} not found",
        )

    return map_dataset_model_to_response(dataset)


@router.put(
    "/{dataset_id}",
    response_model=DatasetResponse,
    tags=["datasets"],
)
async def update_dataset(
        dataset_id: str,
        request: UpdateDatasetRequest,
        db: AsyncSession = Depends(get_db_async),
        user: UserDto = Depends(get_current_user),
):
    dataset = await find_by_id_and_org_id(db, dataset_id, user.organization_id)
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID {dataset_id} not found",
        )

    if request.name is not None:
        dataset.name = request.name
    if request.description is not None:
        dataset.description = request.description
    if request.labels is not None:
        dataset.labels = [label.model_dump() for label in request.labels]

    await db.commit()
    await db.refresh(dataset)

    return map_dataset_model_to_response(dataset)


@router.delete(
    "/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["datasets"]
)
async def delete_dataset(
        dataset_id: str,
        db: AsyncSession = Depends(get_db_async),
        user: UserDto = Depends(get_current_user),
):
    dataset = await find_by_id_and_org_id(db, dataset_id, user.organization_id)
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID {dataset_id} not found",
        )

    await db.delete(dataset)
    all_imgs_smt = select(ImageModel).where(ImageModel.dataset_id == dataset_id)
    results = await db.execute(all_imgs_smt)
    all_imgs = results.scalars().all()
    for img in all_imgs:
        await images_storage.delete_image(img.url)
        await db.delete(img)
    return None


@router.get("/{dataset_id}/export", tags=["client api", "datasets"])
async def export_dataset(
        dataset_id: str,
        only_labeled: bool = True,
        output_format: Literal["csv", "parquet"] = "csv",
        db: AsyncSession = Depends(get_db_async),
        user: UserDto = Depends(verify_client_auth),
):
    dataset = await find_by_id_and_org_id(db, dataset_id, user.organization_id)
    dataset_name = dataset.name
    if not dataset:
        raise HTTPException(
            status_code=404, detail=f"Dataset with ID {dataset_id} not found"
        )
    # Query images
    stmt = select(ImageModel).where(ImageModel.dataset_id == dataset_id)
    if only_labeled:
        stmt = stmt.where(ImageModel.is_labeled)
    stmt = stmt.order_by(ImageModel.created_at.desc())
    result = await db.execute(stmt)
    images = result.scalars().all()
    label_names = []
    if dataset.labels:
        label_names = [label.get("name") for label in dataset.labels]
    out = await dataset_export.export_dataset_rows(images, label_names, output_format)
    match output_format:
        case "csv":
            return StreamingResponse(
                out,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=dataset_{dataset_name}.csv"
                },
            )
        case "parquet":
            return StreamingResponse(
                out,
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": f"attachment; filename=dataset_{dataset_name}.parquet"
                },
            )
        case _:
            raise HTTPException(status_code=400, detail="Invalid output format")
