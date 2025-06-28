from typing import Any, Dict, Literal, Optional

from dotenv import load_dotenv
from pydantic import PostgresDsn, validator
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    ENV: str | None = None

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "aitrace"
    JWT_SECRET_KEY: str = "supersecretkey"
    ANTHROPIC_API_KEY: str = "n/a"
    STORAGE_PROVIDER: str = "local"

    LOCAL_IMG_DIR: str = "images"

    # Google Cloud Storage settings
    GCS_BUCKET_NAME: str = ""
    GCS_PROJECT_ID: str = ""
    GCS_CREDENTIALS_PATH: str = ""

    DEPLOYMENT_MODE: Literal["SASS", "LOCAL"] = "LOCAL"

    ASYNC_SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    APPLICATION_NAME: str = "aitrace"

    AUTH0_DOMAIN: str = ""

    @validator("ASYNC_SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_async_db_connection(
        cls, current_value: Optional[str], values: Dict[str, Any]
    ) -> Any:
        if isinstance(current_value, str):
            return current_value
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("POSTGRES_PORT"),
            path=f"{values.get('POSTGRES_DB') or ''}",
        )


settings = Settings()
