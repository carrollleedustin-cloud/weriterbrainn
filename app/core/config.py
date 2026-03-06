from functools import lru_cache
from typing import Optional

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    # Environment
    env: str = "development"
    debug: bool = True
    project_name: str = "WeriterBrainn"
    api_v1_prefix: str = "/api/v1"

    # Security
    api_key_header_name: str = "x-api-key"
    api_key: Optional[str] = None
    cors_origins: str = "*"  # Comma-separated, or "*" for dev
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Database
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/weriterbrainn"
    )

    @property
    def database_sync_url(self) -> str:
        """Sync URL for Alembic (psycopg)."""
        url = self.database_url
        if "+asyncpg" in url:
            return url.replace("postgresql+asyncpg", "postgresql+psycopg", 1)
        return url

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    openai_embedding_model: str = "text-embedding-3-large"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()

