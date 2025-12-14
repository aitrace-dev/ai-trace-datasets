"""Team repository."""

from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.models.team import Team
from aitrace.repositories.base_repository import BaseRepository


class TeamRepository(BaseRepository[Team]):
    """Team repository."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize team repository."""
        super().__init__(Team, db)

    async def exists_any(self) -> bool:
        """
        Check if any team exists.

        Returns:
            True if at least one team exists
        """
        from sqlalchemy import exists, select

        result = await self.db.execute(select(exists().where(Team.id.isnot(None))))
        return result.scalar() or False
