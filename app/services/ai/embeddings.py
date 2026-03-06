"""OpenAI embeddings client for semantic search."""

from typing import List

from openai import AsyncOpenAI

from app.core.config import settings
from app.models.memory import EMBEDDING_DIM

BATCH_SIZE = 100  # OpenAI embedding batch limit


async def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts. Batches automatically."""
    if not texts:
        return []
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    results: List[List[float]] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        batch = [t.strip() or " " for t in batch]  # empty strings can cause errors
        resp = await client.embeddings.create(
            model=settings.openai_embedding_model,
            input=batch,
        )
        for item in sorted(resp.data, key=lambda d: d.index):
            results.append(item.embedding)
    return results


async def embed_text(text: str) -> List[float]:
    """Generate a single embedding."""
    emb = await get_embeddings([text])
    return emb[0] if emb else []
