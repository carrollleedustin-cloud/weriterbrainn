import { randomUUID } from "crypto";
import { query } from "../lib/db.js";

export class PersonaRepository {
  async getMetricsByUserId(userId) {
    const r = await query(
      `SELECT metric_name, metric_value, sample_count FROM persona_metrics
       WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1`,
      [userId]
    );
    return r.rows;
  }

  async upsertMetric({ userId, metricName, metricValue, sampleCount = 1 }) {
    const existing = await query(
      `SELECT id, metric_value, sample_count FROM persona_metrics
       WHERE metric_name = $1 AND (($2::uuid IS NULL AND user_id IS NULL) OR user_id = $2)
       LIMIT 1`,
      [metricName, userId]
    );
    if (existing.rows[0]) {
      const row = existing.rows[0];
      const n = row.sample_count + 1;
      const newVal = (parseFloat(row.metric_value) * row.sample_count + metricValue) / n;
      await query(
        "UPDATE persona_metrics SET metric_value = $1, sample_count = $2, updated_at = NOW() WHERE id = $3",
        [newVal, n, row.id]
      );
    } else {
      await query(
        `INSERT INTO persona_metrics (id, user_id, metric_name, metric_value, sample_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [randomUUID(), userId, metricName, metricValue, sampleCount]
      );
    }
  }

  async getCognitiveProfile(userId) {
    const r = await query(
      `SELECT profile, updated_at FROM user_cognitive_profiles
       WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    return r.rows[0] || null;
  }

  async upsertCognitiveProfile(userId, profile) {
    await query(
      `INSERT INTO user_cognitive_profiles (user_id, profile, created_at, updated_at)
       VALUES ($1, $2::jsonb, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         profile = $2::jsonb,
         updated_at = NOW()`,
      [userId, JSON.stringify(profile)]
    );
  }
}
