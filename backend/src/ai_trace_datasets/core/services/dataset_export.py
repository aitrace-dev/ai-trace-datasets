import io
from typing import List

import pandas as pd

from ai_trace_datasets.core.models.images import ImageModel
from ai_trace_datasets.core.storage.storage_provider import images_storage


async def export_dataset_rows(
    images: List[ImageModel], label_names: List[str], output_format: str = "csv"
) -> io.BytesIO:
    """
    Export images to CSV or Parquet. Each label becomes a column. Returns a BytesIO buffer.
    :param images: List of image ORM objects (must have .labels as dict, and other fields)
    :param label_names: List of all label names in the dataset (column order)
    :param output_format: 'csv' or 'parquet'
    :return: BytesIO buffer
    """
    # Prepare rows
    rows = []
    for img in images:
        source_url = img.source_url
        if not source_url:
            source_url = await images_storage.get_signed_url(img.url, 30)
        row = {
            "id": str(img.id),
            "name": img.name,
            "source_url": source_url,
            "description": img.description,
            "is_labeled": img.is_labeled,
            "is_queued": img.is_queued,
            "created_at": img.created_at.isoformat() if img.created_at else None,
            "updated_at": img.updated_at.isoformat() if img.updated_at else None,
        }
        img_labels = {
            label.get("name"): label.get("value") for label in img.labels or []
        }
        for label in label_names:
            row[label] = img_labels.get(label, None)
        rows.append(row)

    df = pd.DataFrame(rows)

    if output_format == "csv":
        buf = io.StringIO()
        df.to_csv(buf, index=False)
        out = io.BytesIO(buf.getvalue().encode())
        out.seek(0)
        return out
    elif output_format == "parquet":
        out = io.BytesIO()
        df.to_parquet(out, index=False)
        out.seek(0)
        return out
    else:
        raise ValueError("Invalid format. Use 'csv' or 'parquet'.")
