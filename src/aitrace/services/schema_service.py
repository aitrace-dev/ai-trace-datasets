"""Schema service."""

from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.exceptions import DuplicateException, NotFoundException
from aitrace.models.schema import (
    Schema,
    SchemaCreate,
    SchemaField,
    SchemaResponse,
    SchemaUpdate,
)
from aitrace.repositories.schema_repository import SchemaFieldRepository, SchemaRepository


class SchemaService:
    """Schema service."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize schema service."""
        self.db = db
        self.schema_repo = SchemaRepository(db)
        self.field_repo = SchemaFieldRepository(db)

    async def get_by_id(self, schema_id: UUID) -> SchemaResponse:
        """
        Get schema by ID with fields.

        Args:
            schema_id: Schema ID

        Returns:
            Schema response

        Raises:
            NotFoundException: If schema not found
        """
        schema = await self.schema_repo.get_by_id_with_fields(schema_id)

        if not schema:
            raise NotFoundException("Schema not found")

        return SchemaResponse.model_validate(schema)

    async def get_by_team(
        self, team_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[SchemaResponse], int]:
        """
        Get schemas by team.

        Args:
            team_id: Team ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (schemas, total_count)
        """
        schemas, total = await self.schema_repo.get_by_team(team_id, page, page_size)
        return [SchemaResponse.model_validate(s) for s in schemas], total

    async def create(
        self, data: SchemaCreate, team_id: UUID, created_by: UUID
    ) -> SchemaResponse:
        """
        Create schema.

        Args:
            data: Schema create data
            team_id: Team ID
            created_by: Creator user ID

        Returns:
            Created schema

        Raises:
            DuplicateException: If schema name exists
            NotFoundException: If copy_from_schema_id not found
        """
        # Check name uniqueness
        if await self.schema_repo.exists_by_name_in_team(data.name, team_id):
            raise DuplicateException("A schema with this name already exists")

        # If copying from existing schema
        fields_to_create = data.fields
        if data.copy_from_schema_id:
            source_schema = await self.schema_repo.get_by_id_with_fields(
                data.copy_from_schema_id
            )
            if not source_schema:
                raise NotFoundException("Source schema not found")

            # Copy fields from source schema
            from aitrace.models.schema import SchemaFieldCreate

            fields_to_create = [
                SchemaFieldCreate(
                    name=f.name,
                    type=f.type,
                    required=f.required,
                    default_value=f.default_value,
                    position=f.position,
                    config=f.config,
                )
                for f in source_schema.fields
            ]

        # Create schema
        schema = Schema(
            id=uuid4(),
            name=data.name,
            description=data.description,
            team_id=team_id,
            created_by=created_by,
            updated_by=created_by,
        )

        schema = await self.schema_repo.create(schema)

        # Create fields
        for field_data in fields_to_create:
            field = SchemaField(
                id=uuid4(),
                schema_id=schema.id,
                name=field_data.name,
                type=field_data.type.value,
                required=field_data.required,
                default_value=field_data.default_value,
                position=field_data.position,
                config=field_data.config.model_dump() if field_data.config else {},
            )
            await self.field_repo.create(field)

        # Reload schema with fields
        schema = await self.schema_repo.get_by_id_with_fields(schema.id)

        return SchemaResponse.model_validate(schema)

    async def update(
        self, schema_id: UUID, data: SchemaUpdate, updated_by: UUID
    ) -> SchemaResponse:
        """
        Update schema.

        Args:
            schema_id: Schema ID
            data: Update data
            updated_by: Updater user ID

        Returns:
            Updated schema

        Raises:
            NotFoundException: If schema not found
            DuplicateException: If schema name exists
        """
        schema = await self.schema_repo.get_by_id(schema_id)

        if not schema:
            raise NotFoundException("Schema not found")

        # Check name uniqueness if changing name
        if data.name and data.name != schema.name:
            if await self.schema_repo.exists_by_name_in_team(
                data.name, schema.team_id, schema_id
            ):
                raise DuplicateException("A schema with this name already exists")
            schema.name = data.name

        if data.description is not None:
            schema.description = data.description

        schema.updated_by = updated_by

        # Update fields if provided
        if data.fields is not None:
            # Delete existing fields
            await self.field_repo.delete_by_schema(schema_id)

            # Create new fields
            for field_data in data.fields:
                field = SchemaField(
                    id=uuid4(),
                    schema_id=schema.id,
                    name=field_data.name,
                    type=field_data.type.value,
                    required=field_data.required,
                    default_value=field_data.default_value,
                    position=field_data.position,
                    config=field_data.config.model_dump() if field_data.config else {},
                )
                await self.field_repo.create(field)

        schema = await self.schema_repo.update(schema)

        # Reload with fields
        schema = await self.schema_repo.get_by_id_with_fields(schema.id)

        return SchemaResponse.model_validate(schema)

    async def delete(self, schema_id: UUID) -> None:
        """
        Delete schema.

        Args:
            schema_id: Schema ID

        Raises:
            NotFoundException: If schema not found
        """
        schema = await self.schema_repo.get_by_id(schema_id)

        if not schema:
            raise NotFoundException("Schema not found")

        await self.schema_repo.delete(schema_id)
