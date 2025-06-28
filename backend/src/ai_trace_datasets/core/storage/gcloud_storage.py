import hashlib
import io
import json
import logging

from fastapi import HTTPException
from gcloud.aio.storage import Storage

from ai_trace_datasets.core.schemas.images import ImageDto
from ai_trace_datasets.core.settings.config import settings
from ai_trace_datasets.core.storage.base_storage import BaseImageStorage
from ai_trace_datasets.core.storage.utils import validate_image


class GCSImageStorage(BaseImageStorage):
    def __init__(self):
        self.bucket_name = None
        self.bucket = None
        self.storage = None
        self.service_account_info = None

    async def init(self):
        logging.info(
            f"Initializing Google Cloud Storage repository with bucket: {settings.GCS_BUCKET_NAME}"
        )
        if not settings.GCS_BUCKET_NAME:
            raise ValueError("GCS_BUCKET_NAME is not set in configuration")

        # Load credentials from service account file
        with open(settings.GCS_CREDENTIALS_PATH) as f:
            self.service_account_info = json.load(f)

        self.storage = Storage(
            service_file=settings.GCS_CREDENTIALS_PATH,
        )
        self.bucket = self.storage.get_bucket(settings.GCS_BUCKET_NAME)
        self.bucket_name = settings.GCS_BUCKET_NAME

    async def save_image(self, dataset_id: str, img_bytes: io.BytesIO) -> ImageDto:
        img_bytes, image_type = validate_image(img_bytes)
        md5 = hashlib.md5(img_bytes).hexdigest()

        # Define the blob path in the bucket
        blob_path = f"datasets/{dataset_id}/{md5}.{image_type}"

        # Check if the image already exists
        exists = await self.bucket.blob_exists(blob_path)
        if exists:
            raise HTTPException(
                status_code=409,
                detail="Image already exists in dataset",
            )
        # Upload the image to GCS
        await self.storage.upload(
            self.bucket_name,
            blob_path,
            img_bytes,
            metadata={"Content-Type": f"image/{image_type}"},
        )

        # Generate a public URL
        url = f"gs://{self.bucket_name}/{blob_path}"

        return ImageDto(url=url, md5=md5, media_type=f"image/{image_type}")

    async def delete_image(self, image_path: str):
        # Extract the blob path from the GCS URL
        if image_path.startswith(f"gs://{self.bucket_name}/"):
            blob_path = image_path[len(f"gs://{self.bucket_name}/") :]
        else:
            blob_path = image_path

        exists = await self.bucket.blob_exists(blob_path)
        if not exists:
            return
        try:
            await self.storage.delete(self.bucket_name, blob_path)
        except Exception:
            # If blob doesn't exist, just return
            return

    async def get_signed_url(
        self, image_path: str, expiration_minutes: int = 15
    ) -> str:
        """
        Generate a signed URL for a GCS object that allows temporary access.

        Args:
            image_path: The GCS URL in the format gs://<bucket>/<path>
            expiration_minutes: How long the signed URL should be valid for, in minutes

        Returns:
            A signed URL that provides temporary access to the object
        """
        # Extract the blob path from the GCS URL
        if image_path.startswith(f"gs://{self.bucket_name}/"):
            blob_path = image_path[len(f"gs://{self.bucket_name}/") :]
        else:
            # If it's not a GCS URL, assume it's a direct blob path
            blob_path = image_path

        try:
            # Check if blob exists by getting its metadata
            blob = await self.bucket.get_blob(blob_path)
            return await blob.get_signed_url(expiration=expiration_minutes * 60)
        except Exception:
            raise HTTPException(
                status_code=404,
                detail=f"Image not found in GCS: {blob_path}",
            )
