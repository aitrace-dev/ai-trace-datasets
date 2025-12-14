"""Dataset repository."""

from uuid import UUID

from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.models.dataset import Dataset
from aitrace.models.row import DatasetRow
from aitrace.repositories.base_repository import BaseRepository


class DatasetRepository(BaseRepository[Dataset]):
    """Dataset repository."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize dataset repository."""
        super().__init__(Dataset, db)

    async def get_by_team(
        self, team_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[Dataset], int]:
        """
        Get datasets by team with pagination.

        Args:
            team_id: Team ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (datasets, total_count)
        """
        # Get total count
        count_query = select(func.count()).select_from(Dataset).where(Dataset.team_id == team_id)
        total = await self.db.scalar(count_query) or 0

        # Get paginated results ordered by created_at DESC (newest first)
        query = (
            select(Dataset)
            .where(Dataset.team_id == team_id)
            .order_by(Dataset.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def exists_by_name_in_team(
        self, name: str, team_id: UUID, exclude_id: UUID | None = None
    ) -> bool:
        """
        Check if dataset name exists in team.

        Args:
            name: Dataset name
            team_id: Team ID
            exclude_id: ID to exclude from check (for updates)

        Returns:
            True if name exists
        """
        query = select(exists().where(Dataset.name == name, Dataset.team_id == team_id))
        if exclude_id:
            query = query.where(Dataset.id != exclude_id)

        result = await self.db.execute(query)
        return result.scalar() or False

    async def get_rows_count(self, dataset_id: UUID) -> int:
        """
        Get reviewed rows count for dataset.

        Args:
            dataset_id: Dataset ID

        Returns:
            Number of reviewed rows
        """
        result = await self.db.execute(
            select(func.count())
            .select_from(DatasetRow)
            .where(
                DatasetRow.dataset_id == dataset_id,
                DatasetRow.status == "reviewed"
            )
        )
        return result.scalar() or 0

    async def get_pending_count(self, dataset_id: UUID) -> int:
        """
        Get pending rows count for dataset.

        Args:
            dataset_id: Dataset ID

        Returns:
            Number of pending rows
        """
        result = await self.db.execute(
            select(func.count())
            .select_from(DatasetRow)
            .where(
                DatasetRow.dataset_id == dataset_id,
                DatasetRow.status == "pending"
            )
        )
        return result.scalar() or 0
