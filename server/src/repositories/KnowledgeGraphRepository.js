import { randomUUID } from "crypto";
import { query } from "../lib/db.js";
import { NODE_TYPE_TO_DB } from "../domain/index.js";

export class KnowledgeGraphRepository {
  async findNodesByUserId(userId) {
    const r = await query(
      `SELECT id, name, node_type, description FROM knowledge_graph_nodes
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
      `SELECT id FROM knowledge_graph_nodes
       WHERE LOWER(name) = LOWER($1)
         AND (($2::uuid IS NULL AND user_id IS NULL) OR user_id = $2)
       LIMIT 1`,
      [name, userId]
    );
    return r.rows[0] || null;
  }

  async createNode({ userId, name, nodeType, description }) {
    const id = randomUUID();
    const dbType = NODE_TYPE_TO_DB[(nodeType || "other").toLowerCase()] || "OTHER";
    await query(
      `INSERT INTO knowledge_graph_nodes (id, user_id, name, node_type, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4::nodetype, $5, NOW(), NOW())`,
      [id, userId, name, dbType, description]
    );
    return { id };
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
