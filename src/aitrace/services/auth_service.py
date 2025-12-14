"""Authentication service."""

import secrets
from datetime import datetime, timedelta
from uuid import UUID, uuid4

import bcrypt
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from aitrace.common.exceptions import UnauthorizedException, ValidationException
from aitrace.common.settings import settings
from aitrace.models.user import User
from aitrace.repositories.user_repository import UserRepository


class AuthService:
    """Authentication service."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize auth service."""
        self.db = db
        self.user_repo = UserRepository(db)

    def hash_password(self, password: str) -> str:
        """
        Hash password using bcrypt.

        Args:
            password: Plain password

        Returns:
            Hashed password
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify password using bcrypt.

        Args:
            plain_password: Plain password
            hashed_password: Hashed password

        Returns:
            True if password matches
        """
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    def create_access_token(self, user_id: UUID, remember_me: bool = False) -> str:
        """
        Create JWT access token.

        Args:
            user_id: User ID
            remember_me: Whether to extend expiration

        Returns:
            JWT token
        """
        expires_delta = timedelta(days=7) if remember_me else timedelta(hours=24)
        expire = datetime.utcnow() + expires_delta

        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    async def login(
        self, email: str, password: str, remember_me: bool = False
    ) -> tuple[User, str]:
        """
        Login user.

        Args:
            email: User email
            password: User password
            remember_me: Whether to extend session

        Returns:
            Tuple of (user, access_token)

        Raises:
            UnauthorizedException: If credentials invalid
        """
        user = await self.user_repo.get_by_email(email)

        if not user or not self.verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        token = self.create_access_token(user.id, remember_me)

        return user, token

    async def change_password(
        self, user_id: UUID, old_password: str, new_password: str
    ) -> None:
        """
        Change user password.

        Args:
            user_id: User ID
            old_password: Old password
            new_password: New password

        Raises:
            ValidationException: If old password incorrect
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise UnauthorizedException("User not found")

        if not self.verify_password(old_password, user.password_hash):
            raise ValidationException("Old password is incorrect")

        user.password_hash = self.hash_password(new_password)
        user.must_reset_pwd = False

        await self.user_repo.update(user)

    async def reset_password(self, user_id: UUID, new_password: str) -> None:
        """
        Reset user password (for first login).

        Args:
            user_id: User ID
            new_password: New password
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise UnauthorizedException("User not found")

        user.password_hash = self.hash_password(new_password)
        user.must_reset_pwd = False

        await self.user_repo.update(user)

    def generate_temp_password(self) -> str:
        """
        Generate temporary password.

        Returns:
            Random password
        """
        return secrets.token_urlsafe(12)
