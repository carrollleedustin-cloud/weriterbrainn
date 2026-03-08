import { KnowledgeStateRepository } from "../repositories/KnowledgeStateRepository.js";

/**
 * Knowledge State: who knows what, when.
 * Supports compiler, preview, and Q&A for knowledge-aware reasoning.
 */
export class KnowledgeStateService {
  constructor({ knowledgeStateRepository, narrativeRepository }) {
    this.repo = knowledgeStateRepository;
    this.narrativeRepo = narrativeRepository;
  }

  async recordKnowledge({
    userId,
    characterId,
    factKey,
    assertionType = "knows",
    confidence = 0.8,
    sourcePassage = null,
    sourceObjectId = null,
  }) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    return this.repo.create({
      projectId: project.id,
      characterId,
      factKey,
      assertionType,
      confidence,
      sourcePassage,
      sourceObjectId,
    });
  }

  async getKnowledgeForCharacter(characterId, userId) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const rows = await this.repo.findByCharacter(project.id, characterId);
    return rows.map((r) => ({
      id: r.id,
      fact_key: r.fact_key,
      assertion_type: (r.assertion_type || "").toLowerCase(),
      confidence: r.confidence,
      source_passage: r.source_passage,
      created_at: r.created_at,
    }));
  }

  async getKnowersOfFact(factKey, userId) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const rows = await this.repo.findKnowers(project.id, factKey);
    return rows.map((r) => ({
      character_id: r.character_id,
      character_name: r.character_name,
      assertion_type: (r.assertion_type || "").toLowerCase(),
      confidence: r.confidence,
    }));
  }

  async buildKnowledgeContext(projectId) {
    const rows = await this.repo.findByProject(projectId, 100);
    const byFact = new Map();
    for (const row of rows) {
      if (!byFact.has(row.fact_key)) byFact.set(row.fact_key, []);
      byFact.get(row.fact_key).push({ name: row.character_name, confidence: row.confidence });
    }
    return Array.from(byFact.entries()).map(([fact, knowers]) => ({ fact, knowers }));
  }
}
