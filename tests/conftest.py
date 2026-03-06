import os
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("OPENAI_API_KEY", "sk-test-dummy")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/weriterbrainn_test",
)

from app.main import app
from app.db.session import get_db


async def _mock_get_db() -> AsyncGenerator[MagicMock, None]:
    session = MagicMock()
    session.commit = AsyncMock(return_value=None)
    session.flush = AsyncMock(return_value=None)
    session.refresh = AsyncMock(return_value=None)
    session.execute = AsyncMock(
        return_value=MagicMock(
            fetchall=MagicMock(return_value=[]),
            fetchone=MagicMock(return_value=None),
            scalars=MagicMock(
                return_value=MagicMock(
                    all=MagicMock(return_value=[]),
                    scalars=MagicMock(return_value=MagicMock(one_or_none=MagicMock(return_value=None))),
                )
            ),
        )
    )
    session.add = MagicMock()
    yield session


@pytest.fixture(autouse=True)
def override_db():
    """Override get_db so tests don't require a real database."""
    app.dependency_overrides[get_db] = _mock_get_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")
