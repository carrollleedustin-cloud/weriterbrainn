"""Persona metrics: sentence length, vocabulary complexity, tone, sentiment."""

import re
from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.persona import PersonaMetric


def _avg_sentence_length(text: str) -> float:
    sents = re.split(r"[.!?]+", text)
    sents = [s.strip() for s in sents if s.strip()]
    if not sents:
        return 0.0
    return sum(len(s.split()) for s in sents) / len(sents)


def _vocab_complexity(text: str) -> float:
    words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    if not words:
        return 0.0
    unique = len(set(words))
    return unique / len(words)


async def record_writing_sample(
    session: AsyncSession,
    text: str,
    *,
    user_id: Optional[UUID] = None,
) -> None:
    """Record persona metrics from a writing sample (sentence length, vocabulary)."""
    if not text.strip():
        return

    sent_len = _avg_sentence_length(text)
    vocab = _vocab_complexity(text)

    for name, value in [("avg_sentence_length", sent_len), ("vocab_complexity", vocab)]:
        q = select(PersonaMetric).where(PersonaMetric.metric_name == name)
        if user_id is not None:
            q = q.where(PersonaMetric.user_id == user_id)
        else:
            q = q.where(PersonaMetric.user_id.is_(None))
        result = await session.execute(q.limit(1))
        existing = result.scalar_one_or_none()
        if existing:
            n = existing.sample_count + 1
            existing.metric_value = (existing.metric_value * existing.sample_count + value) / n
            existing.sample_count = n
        else:
            session.add(
                PersonaMetric(
                    user_id=user_id,
                    metric_name=name,
                    metric_value=value,
                    sample_count=1,
                )
            )


async def get_persona_summary(
    session: AsyncSession,
    user_id: Optional[UUID] = None,
) -> dict[str, float]:
    """Return aggregated persona metrics for a user."""
    q = select(PersonaMetric)
    if user_id is not None:
        q = q.where(PersonaMetric.user_id == user_id)
    else:
        q = q.where(PersonaMetric.user_id.is_(None))
    result = await session.execute(q)
    metrics = result.scalars().all()
    return {m.metric_name: m.metric_value for m in metrics}
