"""Memory API tests. Mock store_memory and search_memories to avoid DB/OpenAI."""

from datetime import datetime
from uuid import uuid4
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.memory import Memory, MemoryType


@pytest.fixture
def fake_memory():
    m = Memory(
        id=uuid4(),
        memory_type=MemoryType.NOTE,
        content="test content",
        title="test",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    return m


@pytest.mark.asyncio
async def test_search_empty_query():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/memories/search?q=")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_search_returns_mocked_results(fake_memory):
    with patch(
        "app.api.routes.memory.search_memories",
        new_callable=AsyncMock,
        return_value=[(fake_memory, "chunk", 0.9)],
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.get("/api/v1/memories/search?q=test")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["chunk_text"] == "chunk"
    assert data[0]["score"] == 0.9


@pytest.mark.asyncio
async def test_create_memory_returns_mocked(fake_memory):
    with patch(
        "app.api.routes.memory.store_memory",
        new_callable=AsyncMock,
        return_value=fake_memory,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/v1/memories/",
                json={"content": "hello", "memory_type": "note", "title": "hi"},
            )
    assert r.status_code == 200
    data = r.json()
    assert data["content"] == "test content"
    assert data["memory_type"] == "note"


@pytest.mark.asyncio
async def test_create_memory_invalid_type():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/api/v1/memories/",
            json={"content": "x", "memory_type": "invalid"},
        )
    assert r.status_code == 400
