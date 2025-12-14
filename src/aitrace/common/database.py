"""Database connection and session management."""
import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from google.cloud.sql.connector import Connector
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from aitrace.common.settings import settings


class SessionWrapper:
    def __init__(self):
        self.connector = None
        self.AsyncSessionLocal = None

    async def connect(self):
        if settings.POSTGRES_CONNECTION_MODE == "cloud_sql":
            self.connector = Connector(loop=asyncio.get_event_loop())
            engine = create_async_engine(
                "postgresql+asyncpg://",
                async_creator=lambda: self.connector.connect_async(
                    settings.POSTGRES_CLOUD_SQL_INSTANCE,
                    "asyncpg",
                    user=settings.POSTGRES_USER,
                    password=settings.POSTGRES_PASSWORD,
                    db=settings.POSTGRES_DB,
                ),
                echo=settings.LOG_LEVEL == "DEBUG",
                pool_pre_ping=True,
                pool_size=20,
                max_overflow=10,
            )
        else:
            database_url = (f"postgresql+asyncpg://{settings.POSTGRES_USER}:"
                            f"{settings.POSTGRES_PASSWORD}"
                            f"@"
                            f"{settings.POSTGRES_HOST}:"
                            f"{settings.POSTGRES_PORT}/"
                            f"{settings.POSTGRES_DB}")
            engine = create_async_engine(
                database_url,
                echo=settings.LOG_LEVEL == "DEBUG",
                pool_pre_ping=True,
            )
        self.AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    async def disconnect(self):
        if self.connector is not None:
            await self.connector.close_async()


session_wrapper = SessionWrapper()


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session.

    Yields:
        Database session
    """
    async with session_wrapper.AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database session.

    Yields:
        Database session
    """
    async with get_db() as session:
        yield session
