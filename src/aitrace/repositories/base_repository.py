"""Base repository."""

from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, model: type[ModelType], db: AsyncSession) -> None:
        """
        Initialize repository.

        Args:
            model: SQLAlchemy model class
            db: Database session
        """
        self.model = model
        self.db = db

    async def get_by_id(self, id: UUID) -> ModelType | None:
        """
        Get entity by ID.

        Args:
            id: Entity ID

        Returns:
            Entity or None if not found
        """
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(
        self, page: int = 1, page_size: int = 20, **filters: Any
    ) -> tuple[list[ModelType], int]:
        """
        Get all entities with pagination.

        Args:
            page: Page number (1-indexed)
            page_size: Items per page
            filters: Additional filter conditions

        Returns:
            Tuple of (items, total_count)
        """
        query = select(self.model)

        # Apply filters
        for key, value in filters.items():
            if value is not None and hasattr(self.model, key):
                query = query.where(getattr(self.model, key) == value)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query) or 0

        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)

        # Execute query
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def create(self, entity: ModelType) -> ModelType:
        """
        Create entity.

        Args:
            entity: Entity to create

        Returns:
            Created entity
        """
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def update(self, entity: ModelType) -> ModelType:
        """
        Update entity.

        Args:
            entity: Entity to update

        Returns:
            Updated entity
        """
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def delete(self, id: UUID) -> None:
        """
        Delete entity by ID.

        Args:
            id: Entity ID
        """
        await self.db.execute(delete(self.model).where(self.model.id == id))
        await self.db.flush()
