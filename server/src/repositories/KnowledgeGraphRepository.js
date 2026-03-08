import { randomUUID } from "crypto";
import pgvector from "pgvector";
import { query } from "../lib/db.js";
import { NODE_TYPE_TO_DB } from "../domain/index.js";

export class KnowledgeGraphRepository {
  async findNodesByUserId(userId) {
    const r = await query(
      `SELECT id, name, node_type, description, metadata FROM knowledge_graph_nodes
       WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1
       ORDER BY name`,
      [userId]
    );
    return r.rows;
  }

  async findEdgesByUserId(userId) {
    const r = await query(
      `SELECT e.id, e.source_id, e.target_id, e.relationship_type
       FROM knowledge_graph_edges e
       WHERE e.source_id IN (
         SELECT id FROM knowledge_graph_nodes
         WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1
       ) OR e.target_id IN (
         SELECT id FROM knowledge_graph_nodes
         WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1
       )`,
      [userId]
    );
    return r.rows;
  }

  async searchEntitiesByText(searchTerm, userId, limit = 5) {
    const term = `%${searchTerm.trim()}%`;
    const r = await query(
      `SELECT id, name, node_type, description FROM knowledge_graph_nodes
       WHERE (name ILIKE $1 OR (description IS NOT NULL AND description ILIKE $1))
         AND ($2::uuid IS NULL OR user_id = $2)
       LIMIT $3`,
      [term, userId, limit]
    );
    return r.rows;
  }

  async findRelatedNodeIds(nodeIds, limit = 5) {
    if (!nodeIds?.length) return [];
    const placeholders = nodeIds.map((_, i) => `$${i + 1}`).join(",");
    const r = await query(
      `SELECT source_id, target_id FROM knowledge_graph_edges
       WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})
       LIMIT ${limit * 2}`,
      nodeIds
    );
    const relatedIds = new Set();
    for (const row of r.rows) {
      if (!nodeIds.includes(row.source_id)) relatedIds.add(row.source_id);
      if (!nodeIds.includes(row.target_id)) relatedIds.add(row.target_id);
    }
    return [...relatedIds].slice(0, limit);
  }

  async findNodesByIds(ids) {
    if (!ids.length) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const r = await query(
      `SELECT id, name, node_type, description FROM knowledge_graph_nodes WHERE id IN (${placeholders})`,
      ids
    );
    return r.rows;
  }

  async findNodeByNameAndUser(name, userId) {
    const r = await query(
      `SELECT id, name, node_type, description FROM knowledge_graph_nodes
       WHERE LOWER(name) = LOWER($1)
         AND (($2::uuid IS NULL AND user_id IS NULL) OR user_id = $2)
       LIMIT 1`,
      [name, userId]
    );
    return r.rows[0] || null;
  }

  /** Fetch all nodes for a user (for similarity matching and embedding). */
  async findAllNodeNames(userId) {
    const r = await query(
      `SELECT id, name, description FROM knowledge_graph_nodes
       WHERE user_id = $1`,
      [userId]
    );
    return r.rows;
  }

  async createNode({ userId, name, nodeType, description, metadata }) {
    const id = randomUUID();
    const dbType = NODE_TYPE_TO_DB[(nodeType || "other").toLowerCase()] || "OTHER";
    await query(
      `INSERT INTO knowledge_graph_nodes (id, user_id, name, node_type, description, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4::nodetype, $5, $6::jsonb, NOW(), NOW())`,
      [id, userId, name, dbType, description, metadata ? JSON.stringify(metadata) : null]
    );
    return { id };
  }

  async updateNodeMetadata(nodeId, metadata) {
    await query(
      `UPDATE knowledge_graph_nodes SET metadata = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [nodeId, JSON.stringify(metadata)]
    );
  }

  async updateNodeEmbedding(nodeId, embedding) {
    const vecSql = pgvector.toSql(embedding);
    await query(
      `UPDATE knowledge_graph_nodes SET embedding = $2::vector, updated_at = NOW() WHERE id = $1`,
      [nodeId, vecSql]
    );
  }

  /** Semantic search over node embeddings. Falls back to ILIKE if no embeddings. */
  async searchEntitiesSemantic({ queryEmbedding, userId, limit = 10 }) {
    const vecSql = pgvector.toSql(queryEmbedding);
    const r = await query(
      `SELECT id, name, node_type, description, metadata,
              1 - (embedding <=> $1::vector) AS score
       FROM knowledge_graph_nodes
       WHERE user_id = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [vecSql, userId, limit]
    );
    return r.rows;
  }

  async createEdge(sourceId, targetId, relationshipType) {
    const id = randomUUID();
    await query(
      `INSERT INTO knowledge_graph_edges (id, source_id, target_id, relationship_type, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [id, sourceId, targetId, relationshipType || "related_to"]
    );
  }

  async edgeExists(sourceId, targetId, relationshipType) {
    const r = await query(
      `SELECT 1 FROM knowledge_graph_edges
       WHERE source_id = $1 AND target_id = $2 AND relationship_type = $3 LIMIT 1`,
      [sourceId, targetId, relationshipType]
    );
    return r.rows.length > 0;
  }
}
