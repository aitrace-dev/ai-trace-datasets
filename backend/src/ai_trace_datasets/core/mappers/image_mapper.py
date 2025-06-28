from ai_trace_datasets.core.models.dataset import DatasetModel
from ai_trace_datasets.core.models.images import ImageModel
from ai_trace_datasets.core.schemas.datasets import DatasetResponse
from ai_trace_datasets.core.schemas.images import ImageResponse


def map_image_model_to_response(image: ImageModel) -> ImageResponse:
    return ImageResponse(
        id=str(image.id),
        name=image.name,
        md5=image.md5,
        dataset_id=str(image.dataset_id),
        source_url=image.source_url,
        labels=image.labels,
        is_labeled=image.is_labeled,
        is_queued=image.is_queued,
        comment=image.comment,
        updated_by_username=image.updated_by_username,
        created_at=image.created_at,
        updated_at=image.updated_at,
    )


def map_dataset_model_to_response(dataset: DatasetModel) -> DatasetResponse:
    return DatasetResponse(
        id=str(dataset.id),
        name=dataset.name,
        n_images=dataset.n_images,
        labels=dataset.labels,
        n_queued_images=dataset.n_queued_images,
        n_labeled_images=dataset.n_labeled_images,
        description=dataset.description,
        created_at=dataset.created_at,
        updated_at=dataset.updated_at,
    )
