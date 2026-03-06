"""Chat API tests."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_chat_empty_message():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post("/api/v1/chat/", json={"message": ""})
    assert r.status_code == 422  # Validation error for min_length


@pytest.mark.asyncio
async def test_chat_with_mocked_response():
    with patch(
        "app.api.routes.chat.chat_with_context",
        new_callable=AsyncMock,
        return_value="Mocked response",
    ):
        with patch(
            "app.api.routes.chat.add_message",
            new_callable=AsyncMock,
        ):
            with patch(
                "app.api.routes.chat.get_or_create_conversation",
                new_callable=AsyncMock,
                return_value=MagicMock(id="00000000-0000-0000-0000-000000000001"),
            ):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    r = await client.post(
                        "/api/v1/chat/",
                        json={"message": "Hello", "stream": False},
                    )
    assert r.status_code == 200
    data = r.json()
    assert data["response"] == "Mocked response"
