"""Conversation creation and message persistence."""

from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation, ConversationMessage, MessageRole


async def get_or_create_conversation(
    session: AsyncSession,
    *,
    conversation_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
) -> Conversation:
    """Return existing conversation or create a new one."""
    if conversation_id:
        from sqlalchemy import select
        result = await session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conv = result.scalar_one_or_none()
        if conv:
            return conv
    conv = Conversation(user_id=user_id)
    session.add(conv)
    await session.flush()
    return conv


async def add_message(
    session: AsyncSession,
    conversation_id: UUID,
    role: MessageRole,
    content: str,
) -> ConversationMessage:
    """Add a message to a conversation."""
    msg = ConversationMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    session.add(msg)
    await session.flush()
    return msg
