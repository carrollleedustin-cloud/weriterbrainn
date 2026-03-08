import { randomUUID } from "crypto";
import { query } from "../lib/db.js";

export class AnalyticsRepository {
  async recordEvent({ eventType, userId, payload }) {
    await query(
      `INSERT INTO analytics_events (id, event_type, user_id, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [randomUUID(), eventType, userId, payload ? JSON.stringify(payload) : null]
    );
  }
}
