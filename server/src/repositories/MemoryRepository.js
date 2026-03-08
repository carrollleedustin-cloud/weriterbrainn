import { randomUUID } from "crypto";
import pgvector from "pgvector";
import { query } from "../lib/db.js";
import { MEMORY_TYPE_TO_DB } from "../domain/index.js";

export class MemoryRepository {
  /**
   * @param {Object} params
   * @param {string} params.content
   * @param {string} params.memoryType - lowercase (conversation, note, etc.)
   * @param {string|null} params.title
   * @param {string|null} params.userId
   * @param {number|null} params.importanceScore
   * @param {string|null} params.tier
   */
  async create({ content, memoryType, title, userId, importanceScore, tier }) {
    const id = randomUUID();
    const dbType = MEMORY_TYPE_TO_DB[memoryType] || "NOTE";
    await query(
      `INSERT INTO memories (id, user_id, memory_type, content, title, importance_score, tier, created_at, updated_at)
       VALUES ($1, $2, $3::memorytype, $4, $5, $6, $7, NOW(), NOW())`,
      [id, userId, dbType, content, title, importanceScore ?? null, tier ?? null]
    );
    const r = await query("SELECT * FROM memories WHERE id = $1", [id]);
    return r.rows[0];
  }

  /**
   * Store a single embedding chunk.
   */
  async createEmbedding({ memoryId, chunkIndex, chunkText, embedding }) {
    const id = randomUUID();
    const vecSql = pgvector.toSql(embedding);
    await query(
      `INSERT INTO memory_embeddings (id, memory_id, chunk_index, chunk_text, embedding)
       VALUES ($1, $2, $3, $4, $5::vector)`,
      [id, memoryId, chunkIndex, chunkText, vecSql]
    );
  }

  /**
   * Semantic search over memory embeddings.
   * @param {Object} opts
   * @param {number[]} opts.queryEmbedding
   * @param {string|null} opts.userId
   * @param {number} opts.limit
   * @param {string} [opts.queryText] - Optional text for hybrid FTS boost
   * @param {string} [opts.memoryType] - Filter by memory_type (lowercase)
   * @param {string} [opts.tier] - Filter by tier
   * @param {boolean} [opts.temporalBoost=true] - Apply recency boost (7d +10%, 30d +5%)
   */
  async searchSemantic({
    queryEmbedding,
    userId,
    limit,
    queryText,
    memoryType,
    tier,
    temporalBoost = true,
  }) {
    const vecSql = pgvector.toSql(queryEmbedding);
    const dbMemoryType = memoryType ? MEMORY_TYPE_TO_DB[memoryType] : null;
    const q = queryText?.trim() || "";
    const baseScoreExpr = `(
      0.7 * (1 - (me.embedding <=> $1::vector)) +
      CASE
        WHEN $2 != '' AND to_tsvector('english', coalesce(me.chunk_text, '')) @@ plainto_tsquery('english', $2)
        THEN 0.3 * LEAST(1, ts_rank(to_tsvector('english', coalesce(me.chunk_text, '')), plainto_tsquery('english', $2)) + 0.2)
        ELSE 0
      END
    )`;
    const recencyExpr = temporalBoost
      ? `LEAST(1, ${baseScoreExpr} * CASE
          WHEN m.created_at > NOW() - INTERVAL '7 days' THEN 1.10
          WHEN m.created_at > NOW() - INTERVAL '30 days' THEN 1.05
          ELSE 1.0
        END)`
      : baseScoreExpr;
    const r = await query(
      `SELECT m.id, m.memory_type, m.content, m.title, m.created_at, me.chunk_text,
        ${recencyExpr} AS score
       FROM memory_embeddings me
       JOIN memories m ON m.id = me.memory_id
       WHERE ($3::uuid IS NULL OR m.user_id = $3)
         AND ($4::memorytype IS NULL OR m.memory_type = $4)
         AND ($5::varchar IS NULL OR m.tier = $5)
       ORDER BY score DESC
       LIMIT $6`,
      [vecSql, q, userId, dbMemoryType, tier, limit]
    );
    return r.rows;
  }

  /**
   * Find memories eligible for consolidation (older short_term, low importance).
   */
  async findCandidatesForConsolidation({ userId, olderThanDays = 7, limit = 20 }) {
    const r = await query(
      `SELECT id, content, memory_type, title, importance_score, created_at
       FROM memories
       WHERE user_id = $1
         AND tier = 'short_term'
         AND created_at < NOW() - ($2::text || ' days')::interval
       ORDER BY created_at ASC
       LIMIT $3`,
      [userId, String(olderThanDays), limit]
    );
    return r.rows;
  }

  /**
   * Update memory content and optionally importance/tier (used by consolidation).
   */
  async updateMemory({ memoryId, content, importanceScore, tier }) {
    const updates = [];
    const params = [];
    let i = 1;
    if (content != null) {
      updates.push(`content = $${i++}`);
      params.push(content);
    }
    if (importanceScore != null) {
      updates.push(`importance_score = $${i++}`);
      params.push(importanceScore);
    }
    if (tier != null) {
      updates.push(`tier = $${i++}`);
      params.push(tier);
    }
    if (updates.length === 0) return null;
    updates.push("updated_at = NOW()");
    params.push(memoryId);
    await query(
      `UPDATE memories SET ${updates.join(", ")} WHERE id = $${i}`,
      params
    );
    const r = await query("SELECT * FROM memories WHERE id = $1", [memoryId]);
    return r.rows[0] || null;
  }

  /**
   * Delete embeddings for a memory (before re-embedding consolidated content).
   */
  async deleteEmbeddingsByMemoryId(memoryId) {
    await query("DELETE FROM memory_embeddings WHERE memory_id = $1", [memoryId]);
  }
}
