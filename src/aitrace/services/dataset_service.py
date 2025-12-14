"""Dataset service."""

from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.exceptions import DuplicateException, NotFoundException
from aitrace.models.dataset import DatasetCreate, DatasetResponse, DatasetUpdate, Dataset
from aitrace.repositories.dataset_repository import DatasetRepository
from aitrace.repositories.schema_repository import SchemaRepository


class DatasetService:
    """Dataset service."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize dataset service."""
        self.db = db
        self.dataset_repo = DatasetRepository(db)
        self.schema_repo = SchemaRepository(db)

    async def get_by_id(self, dataset_id: UUID) -> DatasetResponse:
        """
        Get dataset by ID.

        Args:
            dataset_id: Dataset ID

        Returns:
            Dataset response

        Raises:
            NotFoundException: If dataset not found
        """
        dataset = await self.dataset_repo.get_by_id(dataset_id)

        if not dataset:
            raise NotFoundException("Dataset not found")

        # Get counts
        rows_count = await self.dataset_repo.get_rows_count(dataset_id)
        pending_count = await self.dataset_repo.get_pending_count(dataset_id)

        response = DatasetResponse.model_validate(dataset)
        response.rows_count = rows_count
        response.pending_count = pending_count

        return response

    async def get_by_team(
        self, team_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[DatasetResponse], int]:
        """
        Get datasets by team with counts.

        Args:
            team_id: Team ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (datasets, total_count)
        """
        datasets, total = await self.dataset_repo.get_by_team(team_id, page, page_size)

        responses = []
        for dataset in datasets:
            response = DatasetResponse.model_validate(dataset)
            response.rows_count = await self.dataset_repo.get_rows_count(dataset.id)
            response.pending_count = await self.dataset_repo.get_pending_count(dataset.id)
            responses.append(response)

        return responses, total

    async def create(
        self, data: DatasetCreate, team_id: UUID, created_by: UUID
    ) -> DatasetResponse:
        """
        Create dataset.

        Args:
            data: Dataset create data
            team_id: Team ID
            created_by: Creator user ID

        Returns:
            Created dataset

        Raises:
            DuplicateException: If dataset name exists
            NotFoundException: If schema not found
        """
        # Check schema exists
        schema = await self.schema_repo.get_by_id(data.schema_id)
        if not schema:
            raise NotFoundException("Schema not found")

        # Check name uniqueness
        if await self.dataset_repo.exists_by_name_in_team(data.name, team_id):
            raise DuplicateException("A dataset with this name already exists")

        # Create dataset
        dataset = Dataset(
            id=uuid4(),
            name=data.name,
            description=data.description,
            schema_id=data.schema_id,
            team_id=team_id,
            created_by=created_by,
            updated_by=created_by,
        )

        dataset = await self.dataset_repo.create(dataset)

        response = DatasetResponse.model_validate(dataset)
        response.rows_count = 0
        response.pending_count = 0

        return response

    async def update(
        self, dataset_id: UUID, data: DatasetUpdate, updated_by: UUID
    ) -> DatasetResponse:
        """
        Update dataset.

        Args:
            dataset_id: Dataset ID
            data: Update data
            updated_by: Updater user ID

        Returns:
            Updated dataset

        Raises:
            NotFoundException: If dataset not found
            DuplicateException: If dataset name exists
        """
        dataset = await self.dataset_repo.get_by_id(dataset_id)

        if not dataset:
            raise NotFoundException("Dataset not found")

        # Check name uniqueness if changing name
        if data.name and data.name != dataset.name:
            if await self.dataset_repo.exists_by_name_in_team(
                data.name, dataset.team_id, dataset_id
            ):
                raise DuplicateException("A dataset with this name already exists")
            dataset.name = data.name

        if data.description is not None:
            dataset.description = data.description

        dataset.updated_by = updated_by

        dataset = await self.dataset_repo.update(dataset)

        # Get counts
        rows_count = await self.dataset_repo.get_rows_count(dataset_id)
        pending_count = await self.dataset_repo.get_pending_count(dataset_id)

        response = DatasetResponse.model_validate(dataset)
        response.rows_count = rows_count
        response.pending_count = pending_count

        return response

    async def delete(self, dataset_id: UUID) -> None:
        """
        Delete dataset.

        Args:
            dataset_id: Dataset ID

        Raises:
            NotFoundException: If dataset not found
        """
        dataset = await self.dataset_repo.get_by_id(dataset_id)

        if not dataset:
            raise NotFoundException("Dataset not found")

        await self.dataset_repo.delete(dataset_id)
