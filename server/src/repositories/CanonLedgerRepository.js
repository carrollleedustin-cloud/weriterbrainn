import { randomUUID } from "crypto";
import { query } from "../lib/db.js";

const FACT_TYPE_TO_DB = Object.freeze({
  character_state: "CHARACTER_STATE",
  event_occurred: "EVENT_OCCURRED",
  relationship: "RELATIONSHIP",
  lore: "LORE",
  secret: "SECRET",
  timeline: "TIMELINE",
  knowledge_state: "KNOWLEDGE_STATE",
  plot_thread_status: "PLOT_THREAD_STATUS",
  other: "OTHER",
});

const CANON_STATE_TO_DB = Object.freeze({
  confirmed: "CONFIRMED",
  draft: "DRAFT",
  speculative: "SPECULATIVE",
  deprecated: "DEPRECATED",
  branch_alt: "BRANCH_ALT",
  ambiguous: "AMBIGUOUS",
});

export class CanonLedgerRepository {
  async createFact({
    projectId,
    factType = "other",
    factValue,
    entityIds = [],
    sourceText = null,
    sourceObjectId = null,
    sourcePassage = null,
    provenance = {},
    confidence = 0.8,
    canonState = "draft",
    branchId = "main",
    supersedesId = null,
  }) {
    const id = randomUUID();
    const dbFactType = FACT_TYPE_TO_DB[factType] || "OTHER";
    const dbState = CANON_STATE_TO_DB[canonState] || "DRAFT";
    await query(
      `INSERT INTO canon_facts (
        id, project_id, branch_id, fact_type, fact_value, entity_ids,
        source_text, source_object_id, source_passage, provenance,
        confidence, canon_state, supersedes_id
      ) VALUES ($1, $2, $3, $4::canon_fact_type, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11, $12::canon_state, $13)`,
      [
        id,
        projectId,
        branchId,
        dbFactType,
        factValue,
        JSON.stringify(entityIds),
        sourceText,
        sourceObjectId,
        sourcePassage,
        JSON.stringify(provenance),
        confidence,
        dbState,
        supersedesId,
      ]
    );
    const r = await query("SELECT * FROM canon_facts WHERE id = $1", [id]);
    return r.rows[0];
  }

  async findFactsByProject(projectId, opts = {}) {
    const { canonState = null, factType = null, limit = 200 } = opts;
    let sql = `SELECT * FROM canon_facts WHERE project_id = $1 AND superseded_by_id IS NULL`;
    const params = [projectId];
    let idx = 2;
    if (canonState) {
      sql += ` AND canon_state = $${idx}::canon_state`;
      params.push(CANON_STATE_TO_DB[canonState] || canonState.toUpperCase().replace(/-/g, "_"));
      idx++;
    }
    if (factType) {
      sql += ` AND fact_type = $${idx}::canon_fact_type`;
      params.push(FACT_TYPE_TO_DB[factType] || factType);
      idx++;
    }
    sql += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(limit);
    const r = await query(sql, params);
    return r.rows;
  }

  async findFactById(factId) {
    const r = await query("SELECT * FROM canon_facts WHERE id = $1", [factId]);
    return r.rows[0] || null;
  }

  async findFactsForEntity(projectId, entityId) {
    const r = await query(
      `SELECT * FROM canon_facts
       WHERE project_id = $1 AND superseded_by_id IS NULL
       AND (entity_ids @> $2::jsonb OR source_object_id = $3)
       ORDER BY created_at DESC LIMIT 100`,
      [projectId, JSON.stringify([entityId]), entityId]
    );
    return r.rows;
  }

  async supersedeFact(factId, newFactId) {
    await query(
      `UPDATE canon_facts SET superseded_by_id = $2, updated_at = NOW() WHERE id = $1`,
      [factId, newFactId]
    );
  }

  async deprecateFact(factId, reason = null) {
    await query(
      `UPDATE canon_facts SET canon_state = 'DEPRECATED', provenance = provenance || $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [factId, JSON.stringify({ deprecated_reason: reason })]
    );
  }
}
