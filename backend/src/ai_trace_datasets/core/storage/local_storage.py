import hashlib
import io
import logging
from pathlib import Path

from fastapi import HTTPException

from ai_trace_datasets.core.schemas.images import ImageDto
from ai_trace_datasets.core.settings.config import settings
from ai_trace_datasets.core.storage.base_storage import BaseImageStorage
from ai_trace_datasets.core.storage.utils import validate_image


class LocalImageStorage(BaseImageStorage):
    def __init__(self):
        logging.info(f"Setting image directory {settings.LOCAL_IMG_DIR}")
        Path(settings.LOCAL_IMG_DIR).mkdir(parents=True, exist_ok=True)

    async def init(self):
        pass

    async def save_image(self, dataset_id: str, img_bytes: io.BytesIO) -> ImageDto:
        img_bytes_val, image_type = validate_image(img_bytes)
        md5 = hashlib.md5(img_bytes_val).hexdigest()
        dataset_path = Path(settings.LOCAL_IMG_DIR) / dataset_id
        dataset_path.mkdir(parents=True, exist_ok=True)
        img_path = dataset_path / f"{md5}.{image_type}"
        if img_path.exists():
            raise HTTPException(
                status_code=409,
                detail="Image already exists in dataset",
            )
        with open(img_path, "wb") as f:
            f.write(img_bytes_val)
        return ImageDto(url=str(img_path), md5=md5, media_type=f"image/{image_type}")

    async def delete_image(self, image_path: str):
        image_path = Path(image_path)
        if not image_path.exists():
            return
        image_path.unlink()

    async def get_signed_url(
        self, image_path: str, expiration_minutes: int = 15
    ) -> str:
        # For local storage, just return the local file path (url)
        return image_path
