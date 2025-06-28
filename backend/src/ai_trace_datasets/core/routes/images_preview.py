import io

from fastapi import APIRouter, Query, Depends
from fastapi.responses import Response

import ai_trace_datasets.core.services.datasets_images as datasets_images_service
from ai_trace_datasets.core.dependencies.auth import get_current_user
from ai_trace_datasets.core.storage.utils import validate_image

router = APIRouter()


@router.get("", tags=["images-preview"], dependencies=[Depends(get_current_user)])
async def preview_image(url: str = Query(..., description="URL of the image to preview")):
    img_bytes = await datasets_images_service.download_image(url)
    bytes_io = io.BytesIO(img_bytes)
    img_bytes, image_type = validate_image(bytes_io)
    content_type = f"image/{image_type}"
    return Response(content=img_bytes, media_type=content_type)
