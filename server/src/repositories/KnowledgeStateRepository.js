import { randomUUID } from "crypto";
import { query } from "../lib/db.js";

const ASSERTION_TO_DB = Object.freeze({
  knows: "KNOWS",
  suspects: "SUSPECTS",
  does_not_know: "DOES_NOT_KNOW",
  revealed_to: "REVEALED_TO",
  learned_in: "LEARNED_IN",
});

export class KnowledgeStateRepository {
  async create({
    projectId,
    characterId,
    factKey,
    assertionType = "knows",
    confidence = 0.8,
    sourcePassage = null,
    sourceObjectId = null,
    provenance = {},
  }) {
    const id = randomUUID();
    const dbType = ASSERTION_TO_DB[assertionType] || "KNOWS";
    await query(
      `INSERT INTO character_knowledge (
        id, project_id, character_id, fact_key, assertion_type,
        confidence, source_passage, source_object_id, provenance
      ) VALUES ($1, $2, $3, $4, $5::knowledge_assertion_type, $6, $7, $8, $9::jsonb)`,
      [
        id,
        projectId,
        characterId,
        factKey,
        dbType,
        confidence,
        sourcePassage,
        sourceObjectId,
        JSON.stringify(provenance),
      ]
    );
    const r = await query("SELECT * FROM character_knowledge WHERE id = $1", [id]);
    return r.rows[0];
  }

  async findByCharacter(projectId, characterId) {
    const r = await query(
      `SELECT * FROM character_knowledge WHERE project_id = $1 AND character_id = $2 ORDER BY created_at DESC`,
      [projectId, characterId]
    );
    return r.rows;
  }

  async findByFactKey(projectId, factKey) {
    const r = await query(
      `SELECT * FROM character_knowledge WHERE project_id = $1 AND fact_key = $2 ORDER BY created_at DESC`,
      [projectId, factKey]
    );
    return r.rows;
  }

  async findByProject(projectId, limit = 200) {
    const r = await query(
      `SELECT ck.*, no.name AS character_name FROM character_knowledge ck
       JOIN narrative_objects no ON no.id = ck.character_id
       WHERE ck.project_id = $1 ORDER BY ck.created_at DESC LIMIT $2`,
      [projectId, limit]
    );
    return r.rows;
  }

  async findKnowers(projectId, factKey) {
    const r = await query(
      `SELECT ck.*, no.name AS character_name
       FROM character_knowledge ck
       JOIN narrative_objects no ON no.id = ck.character_id
       WHERE ck.project_id = $1 AND ck.fact_key = $2
       AND ck.assertion_type IN ('KNOWS', 'SUSPECTS')
       ORDER BY ck.confidence DESC`,
      [projectId, factKey]
    );
    return r.rows;
  }
}
