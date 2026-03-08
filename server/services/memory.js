import { randomUUID } from "crypto";
import pgvector from "pgvector";
import { getEmbeddings, embedText } from "./embeddings.js";
import { query } from "../db.js";
import { config } from "../config.js";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

function chunkText(text) {
  if (!text?.trim()) return [];
  if (text.length <= CHUNK_SIZE) return [text.trim()];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    let chunk = text.slice(start, end);
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(" ");
      if (lastSpace > CHUNK_SIZE / 2) {
        end = start + lastSpace + 1;
        chunk = text.slice(start, end);
      }
    }
    const trimmed = chunk.trim();
    if (trimmed) chunks.push(trimmed);
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

export async function storeMemory(content, memoryType = "note", title = null, userId = null) {
  const id = randomUUID();
  await query(
    `INSERT INTO memories (id, user_id, memory_type, content, title, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [id, userId, memoryType, content, title]
  );
  const chunks = chunkText(content);
  if (chunks.length && config.openaiApiKey) {
    const embeddings = await getEmbeddings(chunks);
    for (let i = 0; i < chunks.length; i++) {
      if (embeddings[i]?.length === config.embeddingDim) {
        const vecSql = pgvector.toSql(embeddings[i]);
        await query(
          `INSERT INTO memory_embeddings (id, memory_id, chunk_index, chunk_text, embedding)
           VALUES ($1, $2, $3, $4, $5::vector)`,
          [randomUUID(), id, i, chunks[i], vecSql]
        );
      }
    }
  }
  const r = await query("SELECT * FROM memories WHERE id = $1", [id]);
  return r.rows[0];
}

export async function searchMemories(q, limit = 10, userId = null) {
  if (!q?.trim()) return [];
  const embedding = await embedText(q);
  if (!embedding.length) return [];
  const vecSql = pgvector.toSql(embedding);
  const r = await query(
    `SELECT m.id, m.memory_type, m.content, m.title, m.created_at, me.chunk_text,
            1 - (me.embedding <=> $1::vector) AS score
     FROM memory_embeddings me
     JOIN memories m ON m.id = me.memory_id
     WHERE ($2::uuid IS NULL OR m.user_id = $2)
     ORDER BY me.embedding <=> $1::vector
     LIMIT $3`,
    [vecSql, userId, Math.min(limit, 50)]
  );
  return r.rows;
}
