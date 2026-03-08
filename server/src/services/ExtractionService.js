import OpenAI from "openai";
import { config } from "../../config.js";
import { KnowledgeGraphRepository } from "../repositories/KnowledgeGraphRepository.js";

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

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

export class ExtractionService {
  constructor({ knowledgeGraphRepository }) {
    this.kgRepo = knowledgeGraphRepository;
  }

  async extractEntitiesAndRelations(text) {
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
        node_type: (e.type || "other").toLowerCase(),
      }));
      const relationships = data.relationships || [];
      return { entities, relationships };
    } catch {
      return { entities: [], relationships: [] };
    }
  }

  async addToGraph(entities, relationships, userId) {
    const nameToNode = {};
    for (const e of entities) {
      const name = (e.name || "").trim();
      if (!name) continue;
      let node = await this.kgRepo.findNodeByNameAndUser(name, userId);
      if (!node) {
        node = await this.kgRepo.createNode({
          userId,
          name,
          nodeType: e.node_type || e.type,
          description: e.description,
        });
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
        const exists = await this.kgRepo.edgeExists(srcNode.id, tgtNode.id, relType);
        if (!exists) {
          await this.kgRepo.createEdge(srcNode.id, tgtNode.id, relType);
        }
      }
    }
  }
}
