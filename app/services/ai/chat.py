"""RAG chat: unified retrieval, persona-aware prompts, streaming."""

from uuid import UUID
from typing import Optional, AsyncIterator

from openai import AsyncOpenAI

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.ai.retrieval import build_rag_context, RAGContext
from app.services.persona.metrics import get_persona_summary
from app.services.analytics.events import get_adaptive_top_k

SYSTEM_PROMPT = """You are a personal AI brain—a thinking partner that remembers and learns from the user.
Use the provided context (memories, knowledge graph, conversation history) to give relevant, personalized responses.
Be concise but thoughtful. Match the user's communication style when evident from context or persona metrics."""


def _format_context(ctx: RAGContext) -> str:
    parts = []
    if ctx.memory_chunks:
        parts.append("Relevant memories:\n" + "\n".join(f"- {c}" for c in ctx.memory_chunks))
    if ctx.conversation_recent:
        parts.append("Recent conversation:\n" + "\n".join(ctx.conversation_recent))
    if ctx.kg_entities:
        parts.append("Related knowledge:\n" + "\n".join(ctx.kg_entities))
    return "\n\n".join(parts) if parts else "(No relevant context found.)"


def _persona_prompt(metrics: dict[str, float]) -> str:
    if not metrics:
        return ""
    hints = []
    if "avg_sentence_length" in metrics:
        hints.append(f"User tends to use ~{metrics['avg_sentence_length']:.0f} words per sentence.")
    if "vocab_complexity" in metrics:
        hints.append(f"Vocabulary diversity: {metrics['vocab_complexity']:.2f}.")
    if not hints:
        return ""
    return "\nPersona: " + " ".join(hints)


async def chat_with_context(
    session: AsyncSession,
    message: str,
    *,
    user_id: Optional[UUID] = None,
    conversation_id: Optional[UUID] = None,
    top_k: Optional[int] = None,
) -> str:
    """Generate a response using unified RAG and persona-aware prompts."""
    if not settings.openai_api_key:
        return "OpenAI API key is not configured. Please set OPENAI_API_KEY."

    top_k = top_k or await get_adaptive_top_k(session, user_id=user_id, default=5)
    ctx = await build_rag_context(
        session,
        message,
        user_id=user_id,
        conversation_id=conversation_id,
        memory_top_k=top_k,
    )
    persona = await get_persona_summary(session, user_id=user_id)
    persona_str = _persona_prompt(persona)

    system = SYSTEM_PROMPT + persona_str
    user_with_context = f"""Context:
{_format_context(ctx)}

User message: {message}"""

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    resp = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_with_context},
        ],
        temperature=0.7,
    )
    return (resp.choices[0].message.content or "").strip()


async def chat_stream(
    session: AsyncSession,
    message: str,
    *,
    user_id: Optional[UUID] = None,
    conversation_id: Optional[UUID] = None,
    top_k: Optional[int] = None,
) -> AsyncIterator[str]:
    """Stream chat response tokens."""
    if not settings.openai_api_key:
        yield "OpenAI API key is not configured."
        return

    top_k = top_k or await get_adaptive_top_k(session, user_id=user_id, default=5)
    ctx = await build_rag_context(
        session,
        message,
        user_id=user_id,
        conversation_id=conversation_id,
        memory_top_k=top_k,
    )
    persona = await get_persona_summary(session, user_id=user_id)
    persona_str = _persona_prompt(persona)

    system = SYSTEM_PROMPT + persona_str
    user_with_context = f"""Context:
{_format_context(ctx)}

User message: {message}"""

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    stream = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_with_context},
        ],
        temperature=0.7,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield delta
