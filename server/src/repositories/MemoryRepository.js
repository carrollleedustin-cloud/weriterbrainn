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
   */
  async searchSemantic({ queryEmbedding, userId, limit }) {
    const vecSql = pgvector.toSql(queryEmbedding);
    const r = await query(
      `SELECT m.id, m.memory_type, m.content, m.title, m.created_at, me.chunk_text,
              1 - (me.embedding <=> $1::vector) AS score
       FROM memory_embeddings me
       JOIN memories m ON m.id = me.memory_id
       WHERE ($2::uuid IS NULL OR m.user_id = $2)
       ORDER BY me.embedding <=> $1::vector
       LIMIT $3`,
      [vecSql, userId, limit]
    );
    return r.rows;
  }
}
