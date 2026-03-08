import { query } from "../db.js";
import { randomUUID } from "crypto";

function avgSentenceLength(text) {
  const sents = text.split(/[.!?]+/).filter((s) => s.trim());
  if (!sents.length) return 0;
  const total = sents.reduce((sum, s) => sum + s.trim().split(/\s+/).filter(Boolean).length, 0);
  return total / sents.length;
}

function vocabComplexity(text) {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (!words.length) return 0;
  return new Set(words).size / words.length;
}

export async function recordWritingSample(text, userId) {
  if (!text?.trim()) return;
  const sentLen = avgSentenceLength(text);
  const vocab = vocabComplexity(text);
  for (const [name, value] of [
    ["avg_sentence_length", sentLen],
    ["vocab_complexity", vocab],
  ]) {
    const r = await query(
      `SELECT id, metric_value, sample_count FROM persona_metrics
       WHERE metric_name = $1 AND ($2::uuid IS NULL AND user_id IS NULL OR user_id = $2) LIMIT 1`,
      [name, userId]
    );
    if (r.rows[0]) {
      const row = r.rows[0];
      const n = row.sample_count + 1;
      const newVal = (row.metric_value * row.sample_count + value) / n;
      await query(
        "UPDATE persona_metrics SET metric_value = $1, sample_count = $2 WHERE id = $3",
        [newVal, n, row.id]
      );
    } else {
      await query(
        `INSERT INTO persona_metrics (id, user_id, metric_name, metric_value, sample_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 1, NOW(), NOW())`,
        [randomUUID(), userId, name, value]
      );
    }
  }
}

export async function getPersonaSummary(userId) {
  const r = await query(
    "SELECT metric_name, metric_value FROM persona_metrics WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1",
    [userId]
  );
  const metrics = {};
  for (const row of r.rows) metrics[row.metric_name] = parseFloat(row.metric_value);
  return metrics;
}
