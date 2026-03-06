"""Chat API: RAG-backed conversation, streaming, analytics."""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.db.session import get_db, AsyncSessionLocal
from app.models.user import User
from app.services.ai.chat import chat_with_context, chat_stream
from app.services.conversation.conversations import (
    get_or_create_conversation,
    add_message,
)
from app.models.conversation import MessageRole
router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=32_000)
    conversation_id: Optional[str] = None
    stream: bool = False


class ChatResponse(BaseModel):
    response: str
    conversation_id: str


async def _stream_generator(
    session: AsyncSession,
    message: str,
    conv_id: UUID,
    user_id: Optional[UUID] = None,
):
    full = []
    async for token in chat_stream(
        session, message, conversation_id=conv_id, user_id=user_id
    ):
        full.append(token)
        yield token
    await add_message(session, conv_id, MessageRole.USER, message)
    await add_message(session, conv_id, MessageRole.ASSISTANT, "".join(full))
    await session.commit()


async def _auto_store_chat_as_memory(
    session_maker, content: str, user_id: Optional[UUID] = None
) -> None:
    """Store user message as memory in background (remembers everything user writes)."""
    try:
        from app.services.memory.store import store_memory
        from app.models.memory import MemoryType
        async with session_maker() as session:
            await store_memory(
                session, content, memory_type=MemoryType.CONVERSATION, user_id=user_id
            )
    except Exception:  # pragma: no cover
        pass


@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else None
    conv_id = UUID(body.conversation_id) if body.conversation_id else None
    conv = await get_or_create_conversation(
        db, conversation_id=conv_id, user_id=user_id
    )
    conv_id = conv.id

    if body.stream:
        return StreamingResponse(
            _stream_generator(db, body.message.strip(), conv_id, user_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Conversation-Id": str(conv_id),
            },
        )

    response = await chat_with_context(
        db, body.message.strip(), conversation_id=conv_id, user_id=user_id
    )

    await add_message(db, conv_id, MessageRole.USER, body.message.strip())
    background_tasks.add_task(
        _auto_store_chat_as_memory,
        AsyncSessionLocal,
        body.message.strip(),
        user_id,
    )
    await add_message(db, conv_id, MessageRole.ASSISTANT, response)
    await db.commit()

    return ChatResponse(response=response, conversation_id=str(conv_id))
