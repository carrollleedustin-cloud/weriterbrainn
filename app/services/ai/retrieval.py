"""Unified RAG retrieval: memories, conversations, knowledge graph."""

from dataclasses import dataclass
from uuid import UUID
from typing import Optional

from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import Memory
from app.models.conversation import ConversationMessage, MessageRole
from app.models.knowledge_graph import KnowledgeGraphNode, KnowledgeGraphEdge
from app.services.memory.retrieval import search_memories


@dataclass
class RAGContext:
    memory_chunks: list[str]
    conversation_recent: list[str]
    kg_entities: list[str]


async def get_recent_messages(
    session: AsyncSession,
    conversation_id: UUID,
    limit: int = 10,
) -> list[tuple[str, str]]:
    """Return recent (role, content) pairs for a conversation."""
    result = await session.execute(
        select(ConversationMessage.role, ConversationMessage.content)
        .where(ConversationMessage.conversation_id == conversation_id)
        .order_by(ConversationMessage.created_at.desc())
        .limit(limit)
    )
    rows = result.fetchall()
    return [(r[0].value, r[1]) for r in reversed(rows)]


async def search_kg_entities(
    session: AsyncSession,
    query: str,
    *,
    user_id: Optional[UUID] = None,
    limit: int = 5,
) -> list[KnowledgeGraphNode]:
    """Find KG nodes matching query (name/description ILIKE)."""
    if not query.strip():
        return []
    term = f"%{query.strip()}%"
    q = select(KnowledgeGraphNode).where(
        or_(
            KnowledgeGraphNode.name.ilike(term),
            and_(
                KnowledgeGraphNode.description.isnot(None),
                KnowledgeGraphNode.description.ilike(term),
            ),
        )
    )
    if user_id is not None:
        q = q.where(KnowledgeGraphNode.user_id == user_id)
    else:
        q = q.where(KnowledgeGraphNode.user_id.is_(None))
    result = await session.execute(q.limit(limit))
    return list(result.scalars().all())


async def get_related_entities(
    session: AsyncSession,
    node_ids: list[UUID],
    limit: int = 5,
) -> list[KnowledgeGraphNode]:
    """Get nodes connected to the given nodes via edges."""
    if not node_ids:
        return []
    result = await session.execute(
        select(KnowledgeGraphEdge.source_id, KnowledgeGraphEdge.target_id).where(
            or_(
                KnowledgeGraphEdge.source_id.in_(node_ids),
                KnowledgeGraphEdge.target_id.in_(node_ids),
            )
        ).limit(limit * 2)
    )
    related_ids = set()
    for src, tgt in result.fetchall():
        if src not in node_ids:
            related_ids.add(src)
        if tgt not in node_ids:
            related_ids.add(tgt)
    if not related_ids:
        return []
    nodes_result = await session.execute(
        select(KnowledgeGraphNode).where(KnowledgeGraphNode.id.in_(related_ids)).limit(limit)
    )
    return list(nodes_result.scalars().all())


async def build_rag_context(
    session: AsyncSession,
    query: str,
    *,
    user_id: Optional[UUID] = None,
    conversation_id: Optional[UUID] = None,
    memory_top_k: int = 5,
    conv_limit: int = 6,
    kg_limit: int = 5,
) -> RAGContext:
    """Build combined context from memories, conversation, and knowledge graph."""
    memory_chunks = []
    mem_results = await search_memories(session, query, limit=memory_top_k, user_id=user_id)
    memory_chunks = [chunk for _, chunk, _ in mem_results]

    conversation_recent = []
    if conversation_id:
        msgs = await get_recent_messages(session, conversation_id, limit=conv_limit)
        conversation_recent = [f"{role}: {content}" for role, content in msgs]

    kg_entities = []
    kg_nodes = await search_kg_entities(session, query, user_id=user_id, limit=kg_limit)
    if kg_nodes:
        related = await get_related_entities(session, [n.id for n in kg_nodes], limit=3)
        all_nodes = {n.id: n for n in kg_nodes + related}
        for n in (kg_nodes + related)[:kg_limit + 2]:
            desc = f" ({n.description})" if n.description else ""
            kg_entities.append(f"- {n.name} [{n.node_type.value}]{desc}")

    return RAGContext(
        memory_chunks=memory_chunks,
        conversation_recent=conversation_recent,
        kg_entities=kg_entities,
    )
