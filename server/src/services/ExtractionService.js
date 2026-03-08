import OpenAI from "openai";
import { config } from "../../config.js";
import { KnowledgeGraphRepository } from "../repositories/KnowledgeGraphRepository.js";
import { nameSimilarity } from "../lib/entityDedup.js";

const EXTRACTION_PROMPT = `Extract structured entities and relationships from the following text.

For each entity: name, type (person|concept|project|event|other), optional description.
For events: also add "temporal" with date/time if mentioned (e.g. "2020", "last week", "Q1 2023").
For each relationship: source_entity_name, target_entity_name, relationship_type.

Respond with valid JSON only, no markdown:
{
  "entities": [
    {"name": "...", "type": "person|concept|project|event|other", "description": "...", "temporal": "..."}
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

const SIMILARITY_THRESHOLD = 0.82;

export class ExtractionService {
  constructor({ knowledgeGraphRepository, embeddingService }) {
    this.kgRepo = knowledgeGraphRepository;
    this.embeddingService = embeddingService;
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
        temporal: e.temporal || null,
      }));
      const relationships = data.relationships || [];
      return { entities, relationships };
    } catch {
      return { entities: [], relationships: [] };
    }
  }

  async addToGraph(entities, relationships, userId) {
    const nameToNode = {};
    const existingNodes = await this.kgRepo.findAllNodeNames(userId);

    for (const e of entities) {
      const name = (e.name || "").trim();
      if (!name) continue;
      const resolved = await this.resolveEntity(name, e, existingNodes, userId);
      if (resolved) {
        nameToNode[name.toLowerCase()] = resolved.node;
        resolved.node.name = resolved.name;
        resolved.node.description = resolved.description;
      }
    }

    const entityIds = new Set(Object.values(nameToNode).map((n) => n.id));
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

    await this.inferRelationships(entityIds, userId);

    for (const node of Object.values(nameToNode)) {
      await this.maybeEmbedNode(node.id, node.name, node.description);
    }
  }

  async resolveEntity(name, entity, existingNodes, userId) {
    let node = await this.kgRepo.findNodeByNameAndUser(name, userId);
    if (node) return { node, name, description: node.description };
    for (const ex of existingNodes) {
      if (nameSimilarity(name, ex.name) >= SIMILARITY_THRESHOLD) {
        return { node: ex, name: ex.name, description: ex.description };
      }
    }
    const metadata = entity.temporal ? { temporal: entity.temporal } : null;
    const desc = entity.description || (entity.temporal ? `(Occurred: ${entity.temporal})` : null);
    const created = await this.kgRepo.createNode({
      userId,
      name,
      nodeType: entity.node_type || entity.type,
      description: desc,
      metadata,
    });
    const newNode = { id: created.id, name, description: desc };
    existingNodes.push(newNode);
    return { node: newNode, name, description: desc };
  }

  async inferRelationships(entityIds, userId) {
    const ids = [...entityIds];
    let inferred = 0;
    const maxInferred = 15;
    for (let i = 0; i < ids.length && inferred < maxInferred; i++) {
      for (let j = i + 1; j < ids.length && inferred < maxInferred; j++) {
        const a = ids[i];
        const b = ids[j];
        const exists = await this.kgRepo.edgeExists(a, b, "related_to");
        if (!exists) {
          await this.kgRepo.createEdge(a, b, "related_to");
          inferred++;
        }
      }
    }
  }

  async maybeEmbedNode(nodeId, name, description) {
    if (!this.embeddingService || !config.openaiApiKey) return;
    try {
      const text = [name, description].filter(Boolean).join(" ");
      if (!text.trim()) return;
      const emb = await this.embeddingService.embedText(text);
      if (emb?.length === config.embeddingDim) {
        await this.kgRepo.updateNodeEmbedding(nodeId, emb);
      }
    } catch {
      /* skip */
    }
  }
}
