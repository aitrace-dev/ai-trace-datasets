import abc
import io

from ai_trace_datasets.core.schemas.images import ImageDto


class BaseImageStorage(abc.ABC):

    async def init(self):
        raise NotImplementedError

    async def save_image(self, dataset_id: str, img_bytes: io.BytesIO) -> ImageDto:
        raise NotImplementedError

    async def delete_image(self, image_path: str):
        raise NotImplementedError

    async def get_signed_url(
        self, image_path: str, expiration_minutes: int = 15
    ) -> str:
        raise NotImplementedError
