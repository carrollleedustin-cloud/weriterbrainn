import OpenAI from "openai";
import { config } from "../config.js";
import { query } from "../db.js";
import { randomUUID } from "crypto";

const EXTRACTION_PROMPT = `Extract structured entities and relationships from the following text.

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
`;

const TYPE_MAP = {
  person: "PERSON",
  concept: "CONCEPT",
  project: "PROJECT",
  event: "EVENT",
  other: "OTHER",
};

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

export async function extractEntitiesAndRelations(text) {
  if (!text?.trim()) return { entities: [], relationships: [] };
  if (!config.openaiApiKey) return { entities: [], relationships: [] };
  const resp = await getClient().chat.completions.create({
    model: config.openaiModel,
    messages: [{ role: "user", content: EXTRACTION_PROMPT + text.slice(0, 8000) }],
    temperature: 0.1,
  });
  let content = (resp.choices[0]?.message?.content || "").trim();
  if (!content) return { entities: [], relationships: [] };
  if (content.startsWith("```")) {
    const lines = content.split("\n");
    content = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
  }
  try {
    const data = JSON.parse(content);
    const entities = (data.entities || []).map((e) => ({
      ...e,
      node_type: TYPE_MAP[(e.type || "other").toLowerCase()] || "OTHER",
    }));
    const relationships = data.relationships || [];
    return { entities, relationships };
  } catch {
    return { entities: [], relationships: [] };
  }
}

export async function addExtractionToGraph(entities, relationships, userId) {
  const nameToNode = {};
  for (const e of entities) {
    const name = (e.name || "").trim();
    if (!name) continue;
    const r = await query(
      `SELECT id FROM knowledge_graph_nodes WHERE LOWER(name) = LOWER($1)
       AND ($2::uuid IS NULL AND user_id IS NULL OR user_id = $2) LIMIT 1`,
      [name, userId]
    );
    let node;
    if (r.rows[0]) {
      node = r.rows[0];
    } else {
      const id = randomUUID();
      await query(
        `INSERT INTO knowledge_graph_nodes (id, user_id, name, node_type, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [id, userId, name, e.node_type || "OTHER", e.description]
      );
      node = { id };
    }
    nameToNode[name.toLowerCase()] = node;
  }
  for (const rel of relationships) {
    const srcName = (rel.source || "").trim().toLowerCase();
    const tgtName = (rel.target || "").trim().toLowerCase();
    const relType = rel.type || "related_to";
    const srcNode = nameToNode[srcName];
    const tgtNode = nameToNode[tgtName];
    if (srcNode && tgtNode && srcNode.id !== tgtNode.id) {
      const exists = await query(
        `SELECT 1 FROM knowledge_graph_edges
         WHERE source_id = $1 AND target_id = $2 AND relationship_type = $3 LIMIT 1`,
        [srcNode.id, tgtNode.id, relType]
      );
      if (!exists.rows[0]) {
        await query(
          `INSERT INTO knowledge_graph_edges (id, source_id, target_id, relationship_type, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [randomUUID(), srcNode.id, tgtNode.id, relType]
        );
      }
    }
  }
}
