"""Analytics events for self-improvement tracking."""

from uuid import UUID
from typing import Optional, Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import AnalyticsEvent

EVENT_RESPONSE_ACCEPTED = "response_accepted"
EVENT_RESPONSE_REGENERATED = "response_regenerated"
EVENT_RESPONSE_EDITED = "response_edited"
EVENT_RETRIEVAL_USED = "retrieval_used"


async def record_event(
    session: AsyncSession,
    event_type: str,
    *,
    user_id: Optional[UUID] = None,
    payload: Optional[dict[str, Any]] = None,
) -> AnalyticsEvent:
    """Record an analytics event."""
    event = AnalyticsEvent(
        event_type=event_type,
        user_id=user_id,
        payload=payload,
    )
    session.add(event)
    await session.flush()
    return event


async def get_adaptive_top_k(
    session: AsyncSession,
    user_id: Optional[UUID] = None,
    default: int = 5,
    min_k: int = 3,
    max_k: int = 15,
) -> int:
    """Suggest top_k based on regeneration rate: more regens -> increase top_k."""
    from sqlalchemy import select, func

    q = (
        select(
            func.count(AnalyticsEvent.id).filter(
                AnalyticsEvent.event_type == EVENT_RESPONSE_REGENERATED
            ).label("regen"),
            func.count(AnalyticsEvent.id).filter(
                AnalyticsEvent.event_type == EVENT_RESPONSE_ACCEPTED
            ).label("accept"),
        )
        .select_from(AnalyticsEvent)
        .where(
            AnalyticsEvent.event_type.in_([EVENT_RESPONSE_ACCEPTED, EVENT_RESPONSE_REGENERATED]),
            (AnalyticsEvent.user_id == user_id) if user_id else AnalyticsEvent.user_id.is_(None),
        )
    )
    result = await session.execute(q)
    row = result.fetchone()
    if not row or (row[0] or 0) + (row[1] or 0) < 5:
        return default
    total = (row[0] or 0) + (row[1] or 0)
    regen_rate = (row[0] or 0) / total
    if regen_rate > 0.4:
        return min(default + 3, max_k)
    if regen_rate < 0.1:
        return max(default - 1, min_k)
    return default
