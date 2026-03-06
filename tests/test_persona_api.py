"""Persona API tests."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_get_persona_metrics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/persona/")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


@pytest.mark.asyncio
async def test_record_persona_sample():
    with patch(
        "app.api.routes.persona.record_writing_sample",
        new_callable=AsyncMock,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/v1/persona/record",
                json={"text": "Hello world. This is a sample."},
            )
    assert r.status_code == 200
    assert r.json() == {"ok": True}
