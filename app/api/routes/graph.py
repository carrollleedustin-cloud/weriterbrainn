"""Knowledge graph API: nodes, edges, extraction."""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.db.session import get_db
from app.models.user import User
from app.models.knowledge_graph import KnowledgeGraphNode, KnowledgeGraphEdge
from app.services.extraction.extractor import extract_entities_and_relations
from app.services.knowledge_graph.graph import add_extraction_to_graph

router = APIRouter()


class NodeOut(BaseModel):
    id: str
    name: str
    node_type: str
    description: Optional[str]

    @classmethod
    def from_orm(cls, n: KnowledgeGraphNode) -> "NodeOut":
        return cls(
            id=str(n.id),
            name=n.name,
            node_type=n.node_type.value,
            description=n.description,
        )


class EdgeOut(BaseModel):
    id: str
    source_id: str
    target_id: str
    relationship_type: str

    @classmethod
    def from_orm(cls, e: KnowledgeGraphEdge) -> "EdgeOut":
        return cls(
            id=str(e.id),
            source_id=str(e.source_id),
            target_id=str(e.target_id),
            relationship_type=e.relationship_type,
        )


class ExtractRequest(BaseModel):
    text: str


class ExtractResponse(BaseModel):
    entities: int
    relationships: int


@router.get("/nodes", response_model=list[NodeOut])
async def list_nodes(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> list[NodeOut]:
    q = select(KnowledgeGraphNode).order_by(KnowledgeGraphNode.name)
    if current_user:
        q = q.where(KnowledgeGraphNode.user_id == current_user.id)
    else:
        q = q.where(KnowledgeGraphNode.user_id.is_(None))
    result = await db.execute(q)
    nodes = result.scalars().all()
    return [NodeOut.from_orm(n) for n in nodes]


@router.get("/edges", response_model=list[EdgeOut])
async def list_edges(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> list[EdgeOut]:
    subq = select(KnowledgeGraphNode.id)
    if current_user:
        subq = subq.where(KnowledgeGraphNode.user_id == current_user.id)
    else:
        subq = subq.where(KnowledgeGraphNode.user_id.is_(None))
    q = select(KnowledgeGraphEdge).where(
        or_(
            KnowledgeGraphEdge.source_id.in_(subq),
            KnowledgeGraphEdge.target_id.in_(subq),
        )
    )
    result = await db.execute(q)
    edges = result.scalars().all()
    return [EdgeOut.from_orm(e) for e in edges]


@router.post("/extract", response_model=ExtractResponse)
async def extract(
    body: ExtractRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> ExtractResponse:
    if not body.text.strip():
        return ExtractResponse(entities=0, relationships=0)
    entities, relationships = await extract_entities_and_relations(body.text)
    await add_extraction_to_graph(
        db, entities, relationships,
        user_id=current_user.id if current_user else None,
    )
    await db.commit()
    return ExtractResponse(entities=len(entities), relationships=len(relationships))
