"""Analytics API: record self-improvement events."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.db.session import get_db
from app.models.user import User
from app.services.analytics.events import (
    record_event,
    EVENT_RESPONSE_ACCEPTED,
    EVENT_RESPONSE_REGENERATED,
    EVENT_RESPONSE_EDITED,
)

router = APIRouter()

ALLOWED_EVENTS = {
    EVENT_RESPONSE_ACCEPTED,
    EVENT_RESPONSE_REGENERATED,
    EVENT_RESPONSE_EDITED,
}


class AnalyticsEventRequest(BaseModel):
    event_type: str
    payload: Optional[dict] = None


@router.post("/events")
async def record_analytics_event(
    body: AnalyticsEventRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Record response_accepted, response_regenerated, or response_edited."""
    if body.event_type not in ALLOWED_EVENTS:
        return {"ok": False, "error": f"event_type must be one of: {list(ALLOWED_EVENTS)}"}
    await record_event(
        db, body.event_type,
        user_id=current_user.id if current_user else None,
        payload=body.payload,
    )
    await db.commit()
    return {"ok": True}
