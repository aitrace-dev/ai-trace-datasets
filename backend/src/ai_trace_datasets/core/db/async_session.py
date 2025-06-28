from typing import Any, AsyncGenerator

from google.cloud.sql.connector import Connector
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ai_trace_datasets.core.settings.config import settings

async_engine = create_async_engine(
    str(settings.ASYNC_SQLALCHEMY_DATABASE_URI),
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    connect_args={
        "server_settings": {"application_name": settings.APPLICATION_NAME}
    },
    )

AsyncSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=async_engine, class_=AsyncSession
)


async def get_db_async() -> AsyncGenerator[Any, None]:
    async with AsyncSessionLocal() as async_session:
        try:
            yield async_session
            await async_session.commit()
        except:
            await async_session.rollback()
            raise
        finally:
            await async_session.close()
