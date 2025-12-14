"""Team service."""

from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.exceptions import NotFoundException
from aitrace.models.team import Team, TeamCreate, TeamResponse
from aitrace.models.schema import Schema, SchemaField
from aitrace.repositories.team_repository import TeamRepository
from aitrace.repositories.schema_repository import SchemaRepository, SchemaFieldRepository


class TeamService:
    """Team service."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize team service."""
        self.db = db
        self.team_repo = TeamRepository(db)
        self.schema_repo = SchemaRepository(db)
        self.field_repo = SchemaFieldRepository(db)

    async def get_by_id(self, team_id: UUID) -> TeamResponse:
        """
        Get team by ID.

        Args:
            team_id: Team ID

        Returns:
            Team response

        Raises:
            NotFoundException: If team not found
        """
        team = await self.team_repo.get_by_id(team_id)

        if not team:
            raise NotFoundException("Team not found")

        return TeamResponse.model_validate(team)

    async def create(self, data: TeamCreate) -> TeamResponse:
        """
        Create team.

        Args:
            data: Team create data

        Returns:
            Created team
        """
        team = Team(
            id=uuid4(),
            name=data.name,
        )

        team = await self.team_repo.create(team)

        # Create default boolean template schema
        default_schema = Schema(
            id=uuid4(),
            name="Boolean Template",
            description="Default template for boolean classification with predicted value, name, and description",
            team_id=team.id,
            created_by=None,
            updated_by=None,
        )

        default_schema = await self.schema_repo.create(default_schema)

        # Create default fields
        fields = [
            SchemaField(
                id=uuid4(),
                schema_id=default_schema.id,
                name="predicted",
                type="boolean",
                required=True,
                default_value=None,
                position=0,
                config={},
            ),
            SchemaField(
                id=uuid4(),
                schema_id=default_schema.id,
                name="name",
                type="text",
                required=True,
                default_value=None,
                position=1,
                config={},
            ),
            SchemaField(
                id=uuid4(),
                schema_id=default_schema.id,
                name="description",
                type="text",
                required=False,
                default_value=None,
                position=2,
                config={"multiline": True},
            ),
        ]

        for field in fields:
            await self.field_repo.create(field)

        return TeamResponse.model_validate(team)

    async def exists_any(self) -> bool:
        """
        Check if any team exists.

        Returns:
            True if at least one team exists
        """
        return await self.team_repo.exists_any()
