import { randomUUID } from "crypto";
import pgvector from "pgvector";
import { query } from "../lib/db.js";
import { NARRATIVE_OBJECT_TYPE_TO_DB, CANON_STATE_TO_DB } from "../domain/index.js";

/**
 * Repository for Narrative Universe Model: projects, objects, edges, canon ledger.
 * Phase 1 — NIOS.
 */
export class NarrativeRepository {
  async createProject({ userId, title, branch = "main" }) {
    await query(
      `INSERT INTO narrative_projects (id, user_id, title, branch, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [randomUUID(), userId, title, branch]
    );
    const r = await query(
      `SELECT id, user_id, title, branch, created_at FROM narrative_projects
       WHERE user_id = $1 AND branch = $2 ORDER BY created_at DESC LIMIT 1`,
      [userId, branch]
    );
    return r.rows[0];
  }

  async findProjectByUserAndBranch(userId, branch = "main") {
    const r = await query(
      `SELECT id, user_id, title, branch, created_at FROM narrative_projects
       WHERE user_id = $1 AND branch = $2 ORDER BY created_at DESC LIMIT 1`,
      [userId, branch]
    );
    return r.rows[0] || null;
  }

  async getOrCreateDefaultProject(userId) {
    let project = await this.findProjectByUserAndBranch(userId, "main");
    if (!project) {
      project = await this.createProject({ userId, title: "My Story", branch: "main" });
    }
    return project;
  }

  async createObject({
    projectId,
    objectType,
    name,
    summary = null,
    metadata = {},
    canonState = "draft",
    sourcePassage = null,
    embedding = null,
  }) {
    const id = randomUUID();
    const dbType = NARRATIVE_OBJECT_TYPE_TO_DB[objectType] || "OTHER";
    const dbState = CANON_STATE_TO_DB[canonState] || "DRAFT";
    const vecSql = embedding?.length ? pgvector.toSql(embedding) : null;
    await query(
      `INSERT INTO narrative_objects (id, project_id, object_type, name, summary, metadata, canon_state, source_passage, embedding)
       VALUES ($1, $2, $3::narrative_object_type, $4, $5, $6::jsonb, $7::canon_state, $8, ${vecSql ? `$9::vector` : "NULL"})`,
      vecSql
        ? [id, projectId, dbType, name, summary, JSON.stringify(metadata), dbState, sourcePassage, vecSql]
        : [id, projectId, dbType, name, summary, JSON.stringify(metadata), dbState, sourcePassage]
    );
    const r = await query("SELECT * FROM narrative_objects WHERE id = $1", [id]);
    return r.rows[0];
  }

  async findObjectByNameAndProject(projectId, name) {
    const r = await query(
      `SELECT * FROM narrative_objects WHERE project_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [projectId, name]
    );
    return r.rows[0] || null;
  }

  async findObjectsByProject(projectId, objectType = null) {
    let sql = `SELECT * FROM narrative_objects WHERE project_id = $1`;
    const params = [projectId];
    if (objectType) {
      const dbType = NARRATIVE_OBJECT_TYPE_TO_DB[objectType] || "OTHER";
      sql += ` AND object_type = $2::narrative_object_type`;
      params.push(dbType);
    }
    sql += ` ORDER BY object_type, name`;
    const r = await query(sql, params);
    return r.rows;
  }

  async createEdge({ projectId, sourceId, targetId, edgeType = "related_to", metadata = {} }) {
    const id = randomUUID();
    await query(
      `INSERT INTO narrative_edges (id, project_id, source_id, target_id, edge_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [id, projectId, sourceId, targetId, edgeType, JSON.stringify(metadata)]
    );
    return id;
  }

  async edgeExists(projectId, sourceId, targetId, edgeType) {
    const r = await query(
      `SELECT 1 FROM narrative_edges WHERE project_id = $1 AND source_id = $2 AND target_id = $3 AND edge_type = $4 LIMIT 1`,
      [projectId, sourceId, targetId, edgeType]
    );
    return r.rows.length > 0;
  }

  async findEdgesByProject(projectId) {
    const r = await query(
      `SELECT id, source_id, target_id, edge_type, metadata FROM narrative_edges WHERE project_id = $1`,
      [projectId]
    );
    return r.rows;
  }

  async recordCanonEvent({ projectId, eventType, objectId = null, payload = {}, sourcePassage = null }) {
    const id = randomUUID();
    const dbEvent = eventType.toUpperCase().replace(/-/g, "_");
    await query(
      `INSERT INTO canon_ledger_events (id, project_id, event_type, object_id, payload, source_passage)
       VALUES ($1, $2, $3::canon_event_type, $4, $5::jsonb, $6)`,
      [id, projectId, dbEvent, objectId, JSON.stringify(payload), sourcePassage]
    );
    return id;
  }

  async findCanonLedgerEvents(projectId, limit = 100) {
    const r = await query(
      `SELECT id, event_type, object_id, payload, source_passage, created_at
       FROM canon_ledger_events WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [projectId, limit]
    );
    return r.rows;
  }

  async findObjectById(objectId) {
    const r = await query("SELECT * FROM narrative_objects WHERE id = $1", [objectId]);
    return r.rows[0] || null;
  }

  async findEdgesForObject(projectId, objectId) {
    const r = await query(
      `SELECT e.*, src.name AS source_name, tgt.name AS target_name
       FROM narrative_edges e
       JOIN narrative_objects src ON src.id = e.source_id
       JOIN narrative_objects tgt ON tgt.id = e.target_id
       WHERE e.project_id = $1 AND (e.source_id = $2 OR e.target_id = $2)`,
      [projectId, objectId]
    );
    return r.rows;
  }
}
