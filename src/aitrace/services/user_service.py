"""User service."""

from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.exceptions import (
    DuplicateException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from aitrace.models.user import User, UserCreate, UserResponse, UserUpdate
from aitrace.repositories.user_repository import UserRepository
from aitrace.services.auth_service import AuthService


class UserService:
    """User service."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize user service."""
        self.db = db
        self.user_repo = UserRepository(db)
        self.auth_service = AuthService(db)

    async def get_by_id(self, user_id: UUID) -> UserResponse:
        """
        Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User response

        Raises:
            NotFoundException: If user not found
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise NotFoundException("User not found")

        return UserResponse.model_validate(user)

    async def get_by_team(
        self, team_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[UserResponse], int]:
        """
        Get users by team.

        Args:
            team_id: Team ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (users, total_count)
        """
        users, total = await self.user_repo.get_by_team(team_id, page, page_size)
        return [UserResponse.model_validate(u) for u in users], total

    async def create(
        self, data: UserCreate, team_id: UUID, created_by: UUID
    ) -> tuple[UserResponse, str]:
        """
        Create user.

        Args:
            data: User create data
            team_id: Team ID
            created_by: Creator user ID

        Returns:
            Tuple of (user_response, temp_password)

        Raises:
            DuplicateException: If email already exists
        """
        # Check if email exists
        if await self.user_repo.exists_by_email(data.email):
            raise DuplicateException("A user with this email already exists")

        # Generate temporary password
        temp_password = self.auth_service.generate_temp_password()

        # Create user
        user = User(
            id=uuid4(),
            email=data.email.lower(),
            password_hash=self.auth_service.hash_password(temp_password),
            role=data.role.value,
            team_id=team_id,
            must_reset_pwd=True,
        )

        user = await self.user_repo.create(user)

        return UserResponse.model_validate(user), temp_password

    async def update(
        self, user_id: UUID, data: UserUpdate, updated_by: UUID
    ) -> UserResponse:
        """
        Update user.

        Args:
            user_id: User ID
            data: Update data
            updated_by: Updater user ID

        Returns:
            Updated user

        Raises:
            NotFoundException: If user not found
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise NotFoundException("User not found")

        if data.role:
            user.role = data.role.value

        user = await self.user_repo.update(user)

        return UserResponse.model_validate(user)

    async def delete(self, user_id: UUID, deleted_by: UUID) -> None:
        """
        Delete user.

        Args:
            user_id: User ID to delete
            deleted_by: User performing deletion

        Raises:
            NotFoundException: If user not found
            ForbiddenException: If cannot delete (last admin or self)
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise NotFoundException("User not found")

        # Cannot delete yourself
        if user_id == deleted_by:
            raise ForbiddenException("Cannot delete your own account")

        # Cannot delete last admin
        if user.role == "admin":
            admin_count = await self.user_repo.count_admins_in_team(user.team_id)
            if admin_count <= 1:
                raise ForbiddenException("Cannot delete the last admin")

        await self.user_repo.delete(user_id)

    async def reset_user_password(self, user_id: UUID, admin_id: UUID) -> str:
        """
        Reset user password (admin action).

        Args:
            user_id: User ID
            admin_id: Admin user ID

        Returns:
            New temporary password

        Raises:
            NotFoundException: If user not found
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise NotFoundException("User not found")

        # Generate temporary password
        temp_password = self.auth_service.generate_temp_password()

        user.password_hash = self.auth_service.hash_password(temp_password)
        user.must_reset_pwd = True

        await self.user_repo.update(user)

        return temp_password
