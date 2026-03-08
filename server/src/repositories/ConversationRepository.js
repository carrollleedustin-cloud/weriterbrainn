import { randomUUID } from "crypto";
import { query } from "../lib/db.js";
import { MESSAGE_ROLE_TO_DB } from "../domain/index.js";

export class ConversationRepository {
  async findById(id) {
    const r = await query("SELECT id, user_id, title FROM conversations WHERE id = $1", [id]);
    return r.rows[0] || null;
  }

  async getOrCreate(conversationId, userId) {
    if (conversationId) {
      const existing = await this.findById(conversationId);
      if (existing) return existing.id;
    }
    const id = randomUUID();
    await query(
      `INSERT INTO conversations (id, user_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())`,
      [id, userId]
    );
    return id;
  }

  async addMessage(conversationId, role, content) {
    const dbRole = MESSAGE_ROLE_TO_DB[role] || "USER";
    await query(
      `INSERT INTO conversation_messages (id, conversation_id, role, content, created_at)
       VALUES ($1, $2, $3::messagerole, $4, NOW())`,
      [randomUUID(), conversationId, dbRole, content]
    );
  }

  async getRecentMessages(conversationId, limit = 10) {
    const r = await query(
      `SELECT role, content FROM conversation_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [conversationId, limit]
    );
    return r.rows.reverse().map((row) => `${row.role}: ${row.content}`);
  }
}
