"""Entity and relation extraction from text using OpenAI."""

import json
from typing import Any, Optional

from openai import AsyncOpenAI

from app.core.config import settings
from app.models.knowledge_graph import NodeType

EXTRACTION_PROMPT = """Extract structured entities and relationships from the following text.

For each entity, provide: name, type (one of: person, concept, project, event, other), optional description.
For each relationship, provide: source_entity_name, target_entity_name, relationship_type (e.g. "works_on", "knows", "part_of", "related_to").

Respond with valid JSON only, no markdown:
{
  "entities": [
    {"name": "...", "type": "person|concept|project|event|other", "description": "..."}
  ],
  "relationships": [
    {"source": "Entity A", "target": "Entity B", "type": "relationship_type"}
  ]
}

Text:
"""
TYPE_MAP = {
    "person": NodeType.PERSON,
    "concept": NodeType.CONCEPT,
    "project": NodeType.PROJECT,
    "event": NodeType.EVENT,
    "other": NodeType.OTHER,
}


async def extract_entities_and_relations(text: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Extract entities and relationships from text. Returns (entities, relationships)."""
    if not text.strip():
        return [], []
    if not settings.openai_api_key:
        return [], []

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    resp = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[{"role": "user", "content": EXTRACTION_PROMPT + text[:8000]}],
        temperature=0.1,
    )
    content = (resp.choices[0].message.content or "").strip()
    if not content:
        return [], []

    # Strip markdown code blocks if present
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return [], []

    entities = data.get("entities") or []
    relationships = data.get("relationships") or []

    for e in entities:
        t = (e.get("type") or "other").lower()
        e["node_type"] = TYPE_MAP.get(t, NodeType.OTHER)

    return entities, relationships
