"""Persona API: writing metrics."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.db.session import get_db
from app.models.user import User
from app.services.persona.metrics import get_persona_summary, record_writing_sample

router = APIRouter()


class PersonaSample(BaseModel):
    text: str


@router.get("/", response_model=dict)
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> dict:
    return await get_persona_summary(db, user_id=current_user.id if current_user else None)


@router.post("/record")
async def record_sample(
    body: PersonaSample,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> dict:
    await record_writing_sample(
        db, body.text, user_id=current_user.id if current_user else None
    )
    await db.commit()
    return {"ok": True}
