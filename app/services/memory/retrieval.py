"""Semantic retrieval using pgvector."""

from uuid import UUID
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import Memory, MemoryEmbedding
from app.services.ai.embeddings import embed_text


async def search_memories(
    session: AsyncSession,
    query: str,
    *,
    limit: int = 10,
    user_id: Optional[UUID] = None,
) -> list[tuple[Memory, str, float]]:
    """Semantic search. Returns (memory, chunk_text, score) tuples ordered by relevance."""
    query_embedding = await embed_text(query)
    query_vec = str(query_embedding)

    # Join memories + embeddings, filter by user if provided, order by cosine similarity
    # pgvector: <=> is negative inner product; for normalized vectors, smaller <=> = more similar
    # We use 1 - (embedding <=> query) as similarity score
    sql = text("""
        SELECT m.id, me.chunk_text, 1 - (me.embedding <=> :query_vec::vector) AS score
        FROM memory_embeddings me
        JOIN memories m ON m.id = me.memory_id
        WHERE (:user_id::uuid IS NULL OR m.user_id = :user_id)
        ORDER BY me.embedding <=> :query_vec::vector
        LIMIT :limit
    """)
    result = await session.execute(
        sql,
        {"query_vec": query_vec, "user_id": str(user_id) if user_id else None, "limit": limit},
    )
    rows = result.fetchall()
    if not rows:
        return []

    memory_ids = [r[0] for r in rows]
    memories_result = await session.execute(
        select(Memory).where(Memory.id.in_(memory_ids))
    )
    memory_map = {m.id: m for m in memories_result.scalars().all()}

    out = []
    for mem_id, chunk_text, score in rows:
        mem = memory_map.get(mem_id)
        if mem:
            out.append((mem, chunk_text, float(score)))
    return out
