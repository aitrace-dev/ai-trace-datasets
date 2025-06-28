import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.models.feature_flag import FeatureFlagModel, FEATURE_FLAG_AI_NAME_BY_URL


async def get_feature_flags_by_org_id(db: AsyncSession, organization_id: str) -> list[FeatureFlagModel]:
    query = select(FeatureFlagModel).where(FeatureFlagModel.organization_id == organization_id)
    result = await db.execute(query)
    return result.scalars().all()


async def get_feature_flag_by_name_and_org_id(
        db: AsyncSession, name: str, organization_id: str
) -> FeatureFlagModel | None:
    query = select(FeatureFlagModel).where(
        FeatureFlagModel.name == name,
        FeatureFlagModel.organization_id == organization_id,
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def set_feature_flag_enabled(
        db: AsyncSession, name: str, organization_id: str, enabled: bool
) -> FeatureFlagModel | None:
    flag = await get_feature_flag_by_name_and_org_id(db, name, organization_id)
    if flag is None:
        return None
    flag.enabled = enabled
    await db.commit()
    await db.refresh(flag)
    return flag


async def create_default_feature_flags(db: AsyncSession, organization_id: str):
    query = select(FeatureFlagModel).where(
        FeatureFlagModel.name == "ai_name_creation", FeatureFlagModel.organization_id == organization_id
    )
    result = await db.execute(query)
    existing_flag = result.scalar_one_or_none()

    if not existing_flag:
        # Create the AI Name creation feature flag (enabled by default)
        ai_name_flag = FeatureFlagModel(
            id=uuid.uuid4(),
            name=FEATURE_FLAG_AI_NAME_BY_URL,
            enabled=True,
            description="Enable AI-generated name creation for datasets and other resources",
            organization_id=organization_id
        )
        db.add(ai_name_flag)
        await db.commit()
        await db.refresh(ai_name_flag)
        print("Created 'ai_name_creation' feature flag (enabled)")
