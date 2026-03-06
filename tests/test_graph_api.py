"""Knowledge graph API tests. Mock DB and extraction service."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_list_nodes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/graph/nodes")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_edges():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/graph/edges")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_extract_empty_text():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post("/api/v1/graph/extract", json={"text": ""})
    assert r.status_code == 200
    assert r.json() == {"entities": 0, "relationships": 0}


@pytest.mark.asyncio
async def test_extract_mocked():
    with patch(
        "app.api.routes.graph.extract_entities_and_relations",
        new_callable=AsyncMock,
        return_value=(
            [{"name": "Alice", "node_type": "person", "description": None}],
            [{"source": "Alice", "target": "Bob", "type": "knows"}],
        ),
    ):
        with patch(
            "app.api.routes.graph.add_extraction_to_graph",
            new_callable=AsyncMock,
        ):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(
                    "/api/v1/graph/extract",
                    json={"text": "Alice knows Bob"},
                )
    assert r.status_code == 200
    data = r.json()
    assert data["entities"] == 1
    assert data["relationships"] == 1
