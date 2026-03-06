"""Memory storage with embedding generation."""

import re
from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import Memory, MemoryEmbedding, MemoryType, EMBEDDING_DIM
from app.services.ai.embeddings import get_embeddings

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks for embedding."""
    if len(text) <= chunk_size:
        return [text] if text.strip() else []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if end < len(text):
            last_space = chunk.rfind(" ")
            if last_space > chunk_size // 2:
                end = start + last_space + 1
                chunk = text[start:end]
        chunks.append(chunk.strip())
        start = end - overlap
    return [c for c in chunks if c]


async def store_memory(
    session: AsyncSession,
    content: str,
    memory_type: MemoryType = MemoryType.NOTE,
    title: Optional[str] = None,
    user_id: Optional[UUID] = None,
    metadata_: Optional[dict] = None,
) -> Memory:
    """Store a memory and its embeddings. Runs embedding generation inline."""
    memory = Memory(
        user_id=user_id,
        memory_type=memory_type,
        content=content,
        title=title,
        metadata_=metadata_,
    )
    session.add(memory)
    await session.flush()

    chunks = _chunk_text(content)
    if chunks:
        embeddings = await get_embeddings(chunks)
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            if len(emb) != EMBEDDING_DIM:
                continue
            me = MemoryEmbedding(
                memory_id=memory.id,
                chunk_index=i,
                chunk_text=chunk,
                embedding=emb,
            )
            session.add(me)

    await session.commit()
    await session.refresh(memory)
    return memory
