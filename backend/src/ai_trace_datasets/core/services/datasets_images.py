import asyncio
import io
import uuid
from datetime import datetime

import aiohttp
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.mappers.image_mapper import map_image_model_to_response
from ai_trace_datasets.core.models.images import ImageModel
from ai_trace_datasets.core.repositories.datasets import increase_img_count
from ai_trace_datasets.core.repositories.datasets_images import (
    find_image_by_id_and_dataset_id,
)
from ai_trace_datasets.core.schemas.datasets import ImageUpdateRequest
from ai_trace_datasets.core.schemas.images import ImageResponse
from ai_trace_datasets.core.schemas.user_auth import UserDto
from ai_trace_datasets.core.services.ai_service import extract_title_from_url_or_image
from ai_trace_datasets.core.storage.storage_provider import images_storage

DOWNLOAD_IMAGE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.google.com/",
    "DNT": "1",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "cross-site",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
}


async def download_image(img_url: str) -> bytes:
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                    img_url, headers=DOWNLOAD_IMAGE_HEADERS, timeout=10
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"Failed to download image from {img_url}: HTTP {response.status}",
                    )

                # Get image size from headers if available
                content_length = response.headers.get("Content-Length")
                if (
                        content_length and int(content_length) > 10 * 1024 * 1024
                ):  # 10MB limit
                    raise HTTPException(
                        status_code=400,
                        detail=f"Image too large: {int(content_length) / (1024 * 1024):.2f}MB (max 10MB)",
                    )

                return await response.read()

        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408,
                detail=f"Timeout while downloading image from {img_url}",
            )
        except aiohttp.ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Client error while downloading image from {img_url}: {str(e)}",
            )


async def persist_image(
        *,
        db: AsyncSession,
        dataset_id: str,
        img_bytes: io.BytesIO,
        url: str,
        name: str,
        labels: dict | None,
        is_labeled: bool | None,
        comment: str | None,
        user: UserDto,
) -> ImageResponse:
    img_dto = await images_storage.save_image(dataset_id, img_bytes)
    img_bytes.seek(0)
    if name == "" and url:
        computed_name = await extract_title_from_url_or_image(db,
                                                              user.organization_id,
                                                              url,
                                                              img_bytes.read(),
                                                              img_dto.media_type)
        if computed_name:
            name = computed_name
    img_model = ImageModel(
        id=str(uuid.uuid4()),
        name=name,
        url=img_dto.url,
        source_url=url,
        md5=img_dto.md5,
        labels=labels,
        comment=comment,
        dataset_id=dataset_id,
        updated_by_username=user.username,
        is_labeled=is_labeled if is_labeled is not None else False,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    db.add(img_model)
    await increase_img_count(dataset_id, db, 1, 1 if is_labeled else 0)
    await db.commit()
    await db.refresh(img_model)
    return map_image_model_to_response(img_model)


async def update_image(
        *,
        db: AsyncSession,
        dataset_id: str,
        image_id: str,
        request: ImageUpdateRequest,
        user: UserDto,
) -> ImageResponse:
    image = await find_image_by_id_and_dataset_id(db, dataset_id, image_id)
    if not image:
        raise HTTPException(
            status_code=404,
            detail=f"Image with ID {image_id} not found",
        )

    was_labeled = image.is_labeled

    if request.comment:
        image.comment = request.comment

    if request.is_labeled is not None:
        image.is_labeled = request.is_labeled

    if request.name:
        image.name = request.name

    if request.labels:
        image.labels = [label.model_dump(mode="json") for label in request.labels]

    if was_labeled and not image.is_labeled:
        await increase_img_count(dataset_id, db, 0, -1)
    elif not was_labeled and image.is_labeled:
        await increase_img_count(dataset_id, db, 0, 1)

    image.updated_by_username = user.username
    image.updated_at = datetime.now()
    await db.commit()
    await db.refresh(image)
    return map_image_model_to_response(image)
