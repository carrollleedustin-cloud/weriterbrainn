import { CanonLedgerRepository } from "../repositories/CanonLedgerRepository.js";

/**
 * Canon Ledger: structured truth layer with provenance.
 * Records what the system believes, why, where it came from, confidence, and state.
 * Supports explainability, debugging, contradiction tracing, branch/merge.
 */
export class CanonLedgerService {
  constructor({ canonLedgerRepository, narrativeRepository }) {
    this.repo = canonLedgerRepository;
    this.narrativeRepo = narrativeRepository;
  }

  async recordFact({
    userId,
    factType,
    factValue,
    entityIds = [],
    sourceText = null,
    sourceObjectId = null,
    sourcePassage = null,
    provenance = {},
    confidence = 0.8,
    canonState = "draft",
    branchId = "main",
  }) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const fact = await this.repo.createFact({
      projectId: project.id,
      factType: factType || "other",
      factValue,
      entityIds,
      sourceText,
      sourceObjectId,
      sourcePassage,
      provenance,
      confidence,
      canonState,
      branchId,
    });
    await this.narrativeRepo.recordCanonEvent({
      projectId: project.id,
      eventType: "canon_established",
      objectId: sourceObjectId,
      payload: { fact_id: fact.id, fact_value: factValue, confidence },
      sourcePassage: sourcePassage || sourceText,
    });
    return fact;
  }

  async getFacts(userId, opts = {}) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const rows = await this.repo.findFactsByProject(project.id, opts);
    return rows.map((r) => ({
      id: r.id,
      fact_type: (r.fact_type || "").toLowerCase().replace(/_/g, "_"),
      fact_value: r.fact_value,
      entity_ids: r.entity_ids || [],
      source_passage: r.source_passage,
      provenance: r.provenance || {},
      confidence: r.confidence,
      canon_state: (r.canon_state || "").toLowerCase(),
      supersedes_id: r.supersedes_id,
      created_at: r.created_at,
    }));
  }

  async getFactById(factId, userId) {
    const fact = await this.repo.findFactById(factId);
    if (!fact) return null;
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    if (fact.project_id !== project.id) return null;
    return {
      id: fact.id,
      fact_type: (fact.fact_type || "").toLowerCase().replace(/_/g, "_"),
      fact_value: fact.fact_value,
      entity_ids: fact.entity_ids || [],
      source_text: fact.source_text,
      source_object_id: fact.source_object_id,
      source_passage: fact.source_passage,
      provenance: fact.provenance || {},
      confidence: fact.confidence,
      canon_state: (fact.canon_state || "").toLowerCase(),
      supersedes_id: fact.supersedes_id,
      superseded_by_id: fact.superseded_by_id,
      created_at: fact.created_at,
      updated_at: fact.updated_at,
    };
  }

  async getFactsForEntity(entityId, userId) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const rows = await this.repo.findFactsForEntity(project.id, entityId);
    return rows.map((r) => ({
      id: r.id,
      fact_type: (r.fact_type || "").toLowerCase().replace(/_/g, "_"),
      fact_value: r.fact_value,
      confidence: r.confidence,
      canon_state: (r.canon_state || "").toLowerCase(),
      source_passage: r.source_passage,
    }));
  }

  async buildCanonContextForCompiler(projectId) {
    const rows = await this.repo.findFactsByProject(projectId, {
      canonState: null,
      limit: 150,
    });
    const active = rows.filter(
      (r) =>
        !["DEPRECATED"].includes((r.canon_state || "").toUpperCase()) &&
        r.superseded_by_id == null
    );
    return active.map((r) => ({
      id: r.id,
      fact_type: (r.fact_type || "").toLowerCase(),
      fact_value: r.fact_value,
      entity_ids: r.entity_ids,
      confidence: r.confidence,
      canon_state: (r.canon_state || "").toLowerCase(),
      source_passage: r.source_passage ? r.source_passage.slice(0, 200) : null,
    }));
  }
}
