"""Dataset row repository."""

from uuid import UUID

from sqlalchemy import delete, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from aitrace.models.row import DatasetRow
from aitrace.repositories.base_repository import BaseRepository


class DatasetRowRepository(BaseRepository[DatasetRow]):
    """Dataset row repository."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize dataset row repository."""
        super().__init__(DatasetRow, db)

    async def get_by_dataset(
        self,
        dataset_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status: str | None = None,
    ) -> tuple[list[DatasetRow], int]:
        """
        Get rows by dataset with pagination.

        Args:
            dataset_id: Dataset ID
            page: Page number
            page_size: Items per page
            status: Optional status filter

        Returns:
            Tuple of (rows, total_count)
        """
        # Build query with eager loading of user relationships
        query = (
            select(DatasetRow)
            .where(DatasetRow.dataset_id == dataset_id)
            .options(selectinload(DatasetRow.creator))
            .options(selectinload(DatasetRow.updater))
        )

        if status:
            query = query.where(DatasetRow.status == status)

        # Get total count
        count_query = select(func.count()).select_from(
            select(DatasetRow).where(DatasetRow.dataset_id == dataset_id).subquery()
        )
        if status:
            count_query = select(func.count()).select_from(
                select(DatasetRow)
                .where(DatasetRow.dataset_id == dataset_id)
                .where(DatasetRow.status == status)
                .subquery()
            )

        total = await self.db.scalar(count_query) or 0

        # Sort by updated_at descending (most recent first)
        query = query.order_by(DatasetRow.updated_at.desc())

        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)

        # Execute query
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def exists_by_image_hash(self, dataset_id: UUID, image_hash: str, exclude_id: UUID | None = None) -> bool:
        """
        Check if image hash exists in dataset.

        Args:
            dataset_id: Dataset ID
            image_hash: Image hash
            exclude_id: ID to exclude from check (for updates)

        Returns:
            True if hash exists
        """
        query = select(
            exists().where(
                DatasetRow.dataset_id == dataset_id,
                DatasetRow.image_hash == image_hash
            )
        )
        if exclude_id:
            query = query.where(DatasetRow.id != exclude_id)

        result = await self.db.execute(query)
        return result.scalar() or False

    async def bulk_update_status(self, row_ids: list[UUID], status: str) -> None:
        """
        Bulk update row status.

        Args:
            row_ids: List of row IDs
            status: New status
        """
        from sqlalchemy import update

        await self.db.execute(
            update(DatasetRow)
            .where(DatasetRow.id.in_(row_ids))
            .values(status=status)
        )
        await self.db.flush()

    async def bulk_delete(self, row_ids: list[UUID]) -> None:
        """
        Bulk delete rows.

        Args:
            row_ids: List of row IDs
        """
        await self.db.execute(
            delete(DatasetRow).where(DatasetRow.id.in_(row_ids))
        )
        await self.db.flush()

    async def get_pending_rows(
        self, dataset_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[DatasetRow], int]:
        """
        Get pending rows for dataset.

        Args:
            dataset_id: Dataset ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (rows, total_count)
        """
        return await self.get_by_dataset(dataset_id, page, page_size, status="pending")
