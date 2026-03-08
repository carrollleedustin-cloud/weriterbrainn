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

  /**
   * Get event counts grouped by date and event_type for insights dashboard.
   * @param {string} userId
   * @param {number} days - Last N days (default 14)
   */
  async getEventCountsByDay(userId, days = 14) {
    const r = await query(
      `SELECT DATE(created_at) AS date, event_type, COUNT(*) AS count
       FROM analytics_events
       WHERE user_id = $1 AND created_at > NOW() - ($2 || ' days')::interval
       GROUP BY DATE(created_at), event_type
       ORDER BY date ASC`,
      [userId, String(days)]
    );
    return r.rows;
  }
}
