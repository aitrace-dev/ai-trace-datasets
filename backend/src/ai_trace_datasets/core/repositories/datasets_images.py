from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.models.images import ImageModel


async def count_dataset_images(
    db: AsyncSession, dataset_id: str, is_labeled: bool | None, image_name: str | None
) -> int:
    count_stmt = select(func.count()).select_from(ImageModel)
    if is_labeled in [True, False]:
        count_stmt = count_stmt.where(ImageModel.is_labeled == is_labeled)
    count_stmt = count_stmt.where(ImageModel.dataset_id == dataset_id)

    if image_name:
        count_stmt = count_stmt.where(ImageModel.name.ilike(f"%{image_name}%"))

    result = await db.execute(count_stmt)
    return result.scalar_one()


async def get_images(
    db: AsyncSession,
    dataset_id: str,
    is_labeled: bool | None,
    image_name: str | None,
    limit: int,
    offset: int,
) -> Sequence[ImageModel]:
    smt = select(ImageModel)
    if is_labeled in [True, False]:
        smt = smt.where(ImageModel.is_labeled == is_labeled)
    smt = smt.where(ImageModel.dataset_id == dataset_id)
    if image_name:
        smt = smt.where(ImageModel.name.ilike(f"%{image_name}%"))

    smt = smt.order_by(ImageModel.updated_at.desc())
    smt = smt.limit(limit).offset(offset)
    result = await db.execute(smt)
    return result.scalars().all()


async def find_image_by_id_and_dataset_id(
    db: AsyncSession, dataset_id: str, image_id: str
) -> ImageModel | None:
    smt = (
        select(ImageModel)
        .where(ImageModel.id == image_id)
        .where(ImageModel.dataset_id == dataset_id)
    )
    result = await db.execute(smt)
    return result.scalars().first()
