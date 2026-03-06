"""Memory API: store and search."""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.db.session import get_db
from app.models.memory import Memory, MemoryType
from app.models.user import User
from app.services.memory.store import store_memory
from app.services.memory.retrieval import search_memories

router = APIRouter()


class MemoryCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=100_000)
    memory_type: str = "note"
    title: Optional[str] = Field(None, max_length=512)


class MemoryOut(BaseModel):
    id: str
    memory_type: str
    content: str
    title: Optional[str]
    created_at: str

    @classmethod
    def from_orm(cls, m: Memory) -> "MemoryOut":
        return cls(
            id=str(m.id),
            memory_type=m.memory_type.value,
            content=m.content,
            title=m.title,
            created_at=m.created_at.isoformat(),
        )


class SearchResult(BaseModel):
    memory: MemoryOut
    chunk_text: str
    score: float


@router.post("/", response_model=MemoryOut)
async def create_memory(
    body: MemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> MemoryOut:
    try:
        mt = MemoryType(body.memory_type)
    except ValueError:
        raise HTTPException(400, f"Invalid memory_type. Must be one of: {[e.value for e in MemoryType]}")
    memory = await store_memory(
        db,
        content=body.content,
        memory_type=mt,
        title=body.title,
        user_id=current_user.id if current_user else None,
    )
    return MemoryOut.from_orm(memory)


@router.get("/search", response_model=list[SearchResult])
async def search(
    q: str,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> list[SearchResult]:
    if not q.strip():
        return []
    results = await search_memories(
        db, q, limit=min(limit, 50),
        user_id=current_user.id if current_user else None,
    )
    return [
        SearchResult(memory=MemoryOut.from_orm(m), chunk_text=chunk, score=score)
        for m, chunk, score in results
    ]
