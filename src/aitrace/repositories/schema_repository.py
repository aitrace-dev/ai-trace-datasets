"""Schema repository."""

from uuid import UUID

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from aitrace.models.schema import Schema, SchemaField
from aitrace.repositories.base_repository import BaseRepository


class SchemaRepository(BaseRepository[Schema]):
    """Schema repository."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize schema repository."""
        super().__init__(Schema, db)

    async def get_by_id_with_fields(self, id: UUID) -> Schema | None:
        """
        Get schema by ID with fields loaded.

        Args:
            id: Schema ID

        Returns:
            Schema with fields or None
        """
        result = await self.db.execute(
            select(Schema)
            .where(Schema.id == id)
            .options(selectinload(Schema.fields))
        )
        return result.scalar_one_or_none()

    async def get_by_team(
        self, team_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[Schema], int]:
        """
        Get schemas by team with pagination and fields loaded.

        Args:
            team_id: Team ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (schemas, total_count)
        """
        from sqlalchemy import func

        # Get total count
        count_query = select(func.count()).select_from(Schema).where(Schema.team_id == team_id)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get schemas with fields eagerly loaded
        query = (
            select(Schema)
            .where(Schema.team_id == team_id)
            .options(selectinload(Schema.fields))
            .order_by(Schema.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self.db.execute(query)
        schemas = list(result.scalars().all())

        return schemas, total

    async def exists_by_name_in_team(self, name: str, team_id: UUID, exclude_id: UUID | None = None) -> bool:
        """
        Check if schema name exists in team.

        Args:
            name: Schema name
            team_id: Team ID
            exclude_id: ID to exclude from check (for updates)

        Returns:
            True if name exists
        """
        query = select(exists().where(Schema.name == name, Schema.team_id == team_id))
        if exclude_id:
            query = query.where(Schema.id != exclude_id)

        result = await self.db.execute(query)
        return result.scalar() or False


class SchemaFieldRepository(BaseRepository[SchemaField]):
    """Schema field repository."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize schema field repository."""
        super().__init__(SchemaField, db)

    async def get_by_schema(self, schema_id: UUID) -> list[SchemaField]:
        """
        Get fields by schema.

        Args:
            schema_id: Schema ID

        Returns:
            List of schema fields
        """
        result = await self.db.execute(
            select(SchemaField)
            .where(SchemaField.schema_id == schema_id)
            .order_by(SchemaField.position)
        )
        return list(result.scalars().all())

    async def delete_by_schema(self, schema_id: UUID) -> None:
        """
        Delete all fields for a schema.

        Args:
            schema_id: Schema ID
        """
        from sqlalchemy import delete

        await self.db.execute(
            delete(SchemaField).where(SchemaField.schema_id == schema_id)
        )
        await self.db.flush()
