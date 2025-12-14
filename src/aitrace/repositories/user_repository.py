"""User repository."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.models.user import User
from aitrace.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """User repository."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize user repository."""
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        """
        Get user by email.

        Args:
            email: User email

        Returns:
            User or None if not found
        """
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def get_by_team(
        self, team_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[User], int]:
        """
        Get users by team with pagination.

        Args:
            team_id: Team ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (users, total_count)
        """
        return await self.get_all(page=page, page_size=page_size, team_id=team_id)

    async def count_admins_in_team(self, team_id: UUID) -> int:
        """
        Count admins in team.

        Args:
            team_id: Team ID

        Returns:
            Number of admins
        """
        from sqlalchemy import func

        result = await self.db.execute(
            select(func.count())
            .select_from(User)
            .where(User.team_id == team_id, User.role == "admin")
        )
        return result.scalar() or 0

    async def exists_by_email(self, email: str) -> bool:
        """
        Check if user exists by email.

        Args:
            email: User email

        Returns:
            True if user exists
        """
        from sqlalchemy import exists

        result = await self.db.execute(
            select(exists().where(User.email == email.lower()))
        )
        return result.scalar() or False
