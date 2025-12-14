"""Application settings."""
from typing import Literal

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    ENV: str = "local"
    SECRET_KEY: str | None = None
    LOG_LEVEL: str = "INFO"

    # Cloud SQL configuration (for non-local environments)
    POSTGRES_CONNECTION_MODE: Literal["cloud_sql", "direct"] = "direct" # If direct, use POSTGRES_HOST and POSTGRES_PORT
    POSTGRES_CLOUD_SQL_INSTANCE: str | None = None # ONLY if direct mode
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_DB: str | None = None
    POSTGRES_HOST: str | None = None
    POSTGRES_PORT: int | None = None


settings = Settings()
