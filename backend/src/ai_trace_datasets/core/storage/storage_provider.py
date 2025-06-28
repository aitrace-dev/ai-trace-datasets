import logging

from ai_trace_datasets.core.settings.config import settings
from ai_trace_datasets.core.storage.gcloud_storage import GCSImageStorage
from ai_trace_datasets.core.storage.local_storage import LocalImageStorage

logger = logging.getLogger(__name__)

if settings.STORAGE_PROVIDER == "local":
    logger.info("Using local image storage")
    images_storage = LocalImageStorage()
elif settings.STORAGE_PROVIDER == "gcloud":
    logger.info("Using Google Cloud image storage")
    images_storage = GCSImageStorage()
else:
    raise ValueError(f"Unknown storage provider {settings.STORAGE_PROVIDER}")
