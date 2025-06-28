import io
import json
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import RedirectResponse

import ai_trace_datasets.core.repositories.datasets_images as datasets_images_repository
import ai_trace_datasets.core.services.datasets_images as datasets_images_service
from ai_trace_datasets.core.db.async_session import get_db_async
from ai_trace_datasets.core.dependencies.auth import (
    get_current_user,
    verify_client_auth,
)
from ai_trace_datasets.core.mappers.image_mapper import map_image_model_to_response
from ai_trace_datasets.core.models.images import ImageModel
from ai_trace_datasets.core.repositories.datasets import increase_img_count
from ai_trace_datasets.core.schemas.datasets import (
    ImageUpdateRequest,
    ImportImageRequest,
)
from ai_trace_datasets.core.schemas.images import ImageResponse
from ai_trace_datasets.core.schemas.user_auth import UserDto
from ai_trace_datasets.core.services.organization import (
    validate_dataset_belongs_to_organization,
)
from ai_trace_datasets.core.storage.storage_provider import images_storage

router = APIRouter()


@router.get(
    "",
    response_model=List[ImageResponse],
    tags=["dataset-images"],
)
async def list_images(
    dataset_id: str,
    is_labeled: bool | None = None,
    search_by_name: str = None,
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
):
    await validate_dataset_belongs_to_organization(db, dataset_id, user.organization_id)
    total_count = await datasets_images_repository.count_dataset_images(
        db, dataset_id, is_labeled, search_by_name
    )
    images = await datasets_images_repository.get_images(
        db, dataset_id, is_labeled, search_by_name, limit, offset
    )
    response_data = [map_image_model_to_response(image) for image in images]

    response = JSONResponse(
        content=[img.model_dump(mode="json") for img in response_data]
    )
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Page-Size"] = str(limit)
    response.headers["X-Current-Page"] = str(offset // limit + 1 if limit > 0 else 1)
    response.headers["X-Total-Pages"] = str(
        (total_count + limit - 1) // limit if limit > 0 else 1
    )

    # Set CORS headers to expose our custom headers
    response.headers["Access-Control-Expose-Headers"] = (
        "X-Total-Count, X-Page-Size, X-Current-Page, X-Total-Pages"
    )
    return response


@router.post(
    "/upload-by-file", status_code=status.HTTP_201_CREATED, tags=["dataset-images"]
)
async def upload_image_by_file(
    dataset_id: str,
    file: UploadFile = File(...),
    url: str | None = Form(None),
    name: str = Form(""),
    labels: str | None = Form(None),
    is_labeled: bool = Form(False),
    comment: str | None = Form(None),
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
):
    await validate_dataset_belongs_to_organization(db, dataset_id, user.organization_id)
    img_bytes = io.BytesIO(file.file.read())
    labels_json = None
    if labels:
        labels_json = json.loads(labels)

    return await datasets_images_service.persist_image(
        db=db,
        dataset_id=dataset_id,
        img_bytes=img_bytes,
        url=url,
        name=name,
        labels=labels_json,
        is_labeled=is_labeled,
        comment=comment,
        user=user,
    )


@router.post(
    "/upload-by-url", status_code=status.HTTP_201_CREATED, tags=["dataset-images"]
)
async def upload_image_by_url(
    dataset_id: str,
    request: ImportImageRequest,
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(verify_client_auth),
) -> ImageResponse:
    await validate_dataset_belongs_to_organization(db, dataset_id, user.organization_id)
    img_data = await datasets_images_service.download_image(request.url)
    img_bytes = io.BytesIO(img_data)

    if request.labels:
        labels = [label.model_dump() for label in request.labels]
    else:
        labels = None

    return await datasets_images_service.persist_image(
        db=db,
        dataset_id=dataset_id,
        img_bytes=img_bytes,
        url=request.url,
        name=request.name if request.name else "",
        labels=labels,
        is_labeled=request.is_labeled,
        comment=None,
        user=user,
    )


@router.put("/{image_id}", response_model=ImageResponse, tags=["dataset-images"])
async def update_image(
    dataset_id: str,
    image_id: str,
    request: ImageUpdateRequest,
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
) -> ImageResponse:
    await validate_dataset_belongs_to_organization(db, dataset_id, user.organization_id)
    return await datasets_images_service.update_image(
        db=db, dataset_id=dataset_id, image_id=image_id, request=request, user=user
    )


@router.delete(
    "/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["dataset-images"],
)
async def delete_image(
    dataset_id: str,
    image_id: str,
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
):
    await validate_dataset_belongs_to_organization(db, dataset_id, user.organization_id)
    image = await datasets_images_service.find_image_by_id_and_dataset_id(
        db, dataset_id, image_id
    )
    if not image:
        raise HTTPException(
            status_code=404,
            detail=f"Image with ID {image_id} not found",
        )

    labels = -1 if image.is_labeled else 0
    await increase_img_count(dataset_id, db, -1, labels)
    await images_storage.delete_image(image.url)
    await db.delete(image)
    return None


@router.get("/{image_id}/render", tags=["dataset-images"])
async def render_image(
    dataset_id: str,
    image_id: str,
    db: AsyncSession = Depends(get_db_async),
    user: UserDto = Depends(get_current_user),
):
    await validate_dataset_belongs_to_organization(db, dataset_id, user.organization_id)
    smt = select(ImageModel).where(ImageModel.id == image_id)
    result = await db.execute(smt)
    image = result.scalars().first()
    if not image:
        raise HTTPException(
            status_code=404,
            detail=f"Image with ID {image_id} not found",
        )

    # Add cache headers for one hour (3600 seconds)
    cache_headers = {"Cache-Control": "public, max-age=3600"}

    if image.source_url:
        return RedirectResponse(url=image.source_url, headers=cache_headers)
    signed_url = await images_storage.get_signed_url(image.url, 30)
    return RedirectResponse(url=signed_url, headers=cache_headers)
