"""Analytics API tests."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_record_response_accepted():
    with patch(
        "app.api.routes.analytics.record_event",
        new_callable=AsyncMock,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/v1/analytics/events",
                json={"event_type": "response_accepted"},
            )
    assert r.status_code == 200
    assert r.json() == {"ok": True}


@pytest.mark.asyncio
async def test_record_invalid_event():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/api/v1/analytics/events",
            json={"event_type": "invalid"},
        )
    assert r.status_code == 200
    assert r.json()["ok"] is False
    assert "error" in r.json()
