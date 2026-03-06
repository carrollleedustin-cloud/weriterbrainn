"""Knowledge graph: upsert nodes, edges, merge entities."""

from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_graph import (
    KnowledgeGraphNode,
    KnowledgeGraphEdge,
    NodeType,
)


async def upsert_node(
    session: AsyncSession,
    name: str,
    *,
    node_type: NodeType = NodeType.OTHER,
    description: Optional[str] = None,
    user_id: Optional[UUID] = None,
    metadata_: Optional[dict] = None,
) -> KnowledgeGraphNode:
    """Create or update a node by name (case-insensitive match for merge)."""
    name_clean = name.strip()
    if not name_clean:
        raise ValueError("Node name cannot be empty")

    q = select(KnowledgeGraphNode).where(KnowledgeGraphNode.name.ilike(name_clean))
    if user_id is not None:
        q = q.where(KnowledgeGraphNode.user_id == user_id)
    else:
        q = q.where(KnowledgeGraphNode.user_id.is_(None))
    result = await session.execute(q.limit(1))
    existing = result.scalar_one_or_none()
    if existing:
        if description is not None:
            existing.description = description or existing.description
        if metadata_ is not None:
            existing.metadata_ = {**(existing.metadata_ or {}), **metadata_}
        existing.node_type = node_type
        await session.flush()
        return existing

    node = KnowledgeGraphNode(
        user_id=user_id,
        name=name_clean,
        node_type=node_type,
        description=description,
        metadata_=metadata_,
    )
    session.add(node)
    await session.flush()
    return node


async def upsert_edge(
    session: AsyncSession,
    source_id: UUID,
    target_id: UUID,
    relationship_type: str,
    *,
    metadata_: Optional[dict] = None,
) -> KnowledgeGraphEdge:
    """Create or return existing edge between nodes."""
    result = await session.execute(
        select(KnowledgeGraphEdge).where(
            KnowledgeGraphEdge.source_id == source_id,
            KnowledgeGraphEdge.target_id == target_id,
            KnowledgeGraphEdge.relationship_type == relationship_type,
        ).limit(1)
    )
    existing = result.scalar_one_or_none()
    if existing:
        if metadata_:
            existing.metadata_ = {**(existing.metadata_ or {}), **metadata_}
        return existing

    edge = KnowledgeGraphEdge(
        source_id=source_id,
        target_id=target_id,
        relationship_type=relationship_type.strip(),
        metadata_=metadata_,
    )
    session.add(edge)
    await session.flush()
    return edge


async def add_extraction_to_graph(
    session: AsyncSession,
    entities: list[dict],
    relationships: list[dict],
    *,
    user_id: Optional[UUID] = None,
) -> None:
    """Add extracted entities and relationships to the knowledge graph."""
    name_to_node: dict[str, KnowledgeGraphNode] = {}
    for e in entities:
        node = await upsert_node(
            session,
            e.get("name") or "",
            node_type=e.get("node_type", NodeType.OTHER),
            description=e.get("description"),
            user_id=user_id,
        )
        name_to_node[(e.get("name") or "").strip().lower()] = node

    for r in relationships:
        src_name = (r.get("source") or "").strip().lower()
        tgt_name = (r.get("target") or "").strip().lower()
        rel_type = r.get("type") or "related_to"
        src_node = name_to_node.get(src_name)
        tgt_node = name_to_node.get(tgt_name)
        if src_node and tgt_node and src_node.id != tgt_node.id:
            await upsert_edge(session, src_node.id, tgt_node.id, rel_type)
