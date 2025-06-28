from datetime import datetime
from uuid import UUID

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.models.user import UserModel


async def list_users_by_org_id(db: AsyncSession, organization_id: str):
    """List all users"""
    stmt = select(UserModel).where(UserModel.organization_id == organization_id)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_user(db: AsyncSession, user_id: UUID):
    """Get a user by ID"""
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_user_by_username(db: AsyncSession, username: str):
    """Get a user by username"""
    stmt = select(UserModel).where(UserModel.username == username)
    result = await db.execute(stmt)
    return result.scalars().first()


async def create_user(
        db: AsyncSession,
        username: str,
        password: str,
        roles: list[str],
        organization_id: UUID | str,
):
    """Create a new user"""
    # Hash the password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    # Create user
    new_user = UserModel(
        username=username,
        password_hash=hashed_password,
        roles=roles,
        created_at=datetime.now(),
        organization_id=organization_id,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


async def update_password(db: AsyncSession, user_id: UUID, new_password: str):
    """Update a user's password"""
    user = await get_user(db, user_id)
    if not user:
        return None

    # Hash the new password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), salt).decode("utf-8")

    # Update password
    user.password_hash = hashed_password
    await db.commit()
    return user


async def delete_user(db: AsyncSession, user_id: UUID):
    """Delete a user"""
    user = await get_user(db, user_id)
    if not user:
        return False

    await db.delete(user)
    await db.commit()
    return True
