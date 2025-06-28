from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.models.key_management import APIKeyModel


async def get_api_key_by_hash(db: AsyncSession, key_hash: str):
    stmt = select(APIKeyModel).where(APIKeyModel.key_hash == key_hash)
    result = await db.execute(stmt)
    return result.scalars().first()
