import asyncio
import uuid
from datetime import datetime

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.db.async_session import AsyncSessionLocal
from ai_trace_datasets.core.db.async_session import async_engine
from ai_trace_datasets.core.models.dataset import DatasetModel
from ai_trace_datasets.core.models.feature_flag import (
    FeatureFlagModel,
)
from ai_trace_datasets.core.models.images import ImageModel
from ai_trace_datasets.core.models.key_management import APIKeyModel
from ai_trace_datasets.core.models.organization import OrganizationModel
from ai_trace_datasets.core.models.test_run import TestRunModel
from ai_trace_datasets.core.models.user import UserModel
from ai_trace_datasets.core.repositories.feature_flags import create_default_feature_flags


async def create_user(
        db: AsyncSession, username: str, password: str, roles: list[str], organization_id
):
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password_bytes, salt).decode("utf-8")

    user = UserModel(
        id=uuid.uuid4(),
        username=username,
        password_hash=password_hash,
        roles=roles,
        organization_id=organization_id,
        created_at=datetime.now(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_default_organization():
    """Create a default organization if none exists."""
    async with AsyncSessionLocal() as async_session:
        # Check if any organization exists
        query = select(OrganizationModel)
        result = await async_session.execute(query)
        existing_org = result.scalar_one_or_none()

        if not existing_org:
            # Create a default organization
            default_org = OrganizationModel(
                id=uuid.uuid4(), name="Default Organization"
            )
            async_session.add(default_org)
            await async_session.commit()
            print("Created 'Default Organization'")
            return str(default_org.id)
        return str(existing_org.id)


async def main():
    # First create all tables
    ddls = [
        OrganizationModel.metadata.create_all,
        ImageModel.metadata.create_all,
        DatasetModel.metadata.create_all,
        APIKeyModel.metadata.create_all,
        UserModel.metadata.create_all,
        TestRunModel.metadata.create_all,
        FeatureFlagModel.metadata.create_all

    ]
    for ddl in ddls:
        async with async_engine.begin() as conn:
            await conn.run_sync(ddl)

    # Then create default data
    org_id = await create_default_organization()

    async with AsyncSessionLocal() as async_session:
        await create_default_feature_flags(async_session, org_id)
    async with AsyncSessionLocal() as db:
        await create_user(db, "admin", "admin", ["admin"], org_id)
        print("Admin user created successfully")


if __name__ == "__main__":
    asyncio.run(main())
