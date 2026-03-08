import OpenAI from "openai";
import { config } from "../../config.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

/**
 * Character Intelligence V2: persistent cognition layer.
 * Goals, fears, beliefs, loyalties, desires, knowledge state, arc phase.
 * Persists inferred traits with confidence; supports refresh from new text.
 */
export class CharacterService {
  constructor({ narrativeRepository, knowledgeStateService = null }) {
    this.narrativeRepo = narrativeRepository;
    this.knowledgeState = knowledgeStateService;
  }

  async getCharacterDetails(objectId, userId) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const obj = await this.narrativeRepo.findObjectById(objectId);
    if (!obj || obj.project_id !== project.id) return null;

    const edges = await this.narrativeRepo.findEdgesForObject(project.id, objectId);
    const edgesStr = edges
      .map((e) => {
        const other = e.source_id === objectId ? e.target_name : e.source_name;
        return `${obj.name} --[${e.edge_type}]--> ${other}`;
      })
      .join("\n");

    let knowledge = [];
    if (this.knowledgeState) {
      try {
        knowledge = await this.knowledgeState.getKnowledgeForCharacter(objectId, userId);
      } catch {
        knowledge = [];
      }
    }

    const existing = obj.metadata || {};

    if (!config.openaiApiKey) {
      return {
        id: obj.id,
        name: obj.name,
        summary: obj.summary,
        metadata: existing,
        relationships: edges.map((e) => ({
          type: e.edge_type,
          other: e.source_id === objectId ? e.target_name : e.source_name,
        })),
        knowledge,
      };
    }

    const prompt = `Infer character psychology from this story data. Output JSON only.

Character: ${obj.name}
Summary: ${obj.summary || "N/A"}
Relationships: ${edgesStr || "None"}

${Object.keys(existing).length ? `Existing: ${JSON.stringify(existing)}` : ""}

Infer and output (all arrays may be empty if not evident):
{
  "goals": ["2-4 goals or motivations"],
  "fears": ["1-3 fears or vulnerabilities"],
  "beliefs": ["core beliefs about world/self"],
  "loyalties": ["who or what they're loyal to"],
  "desires": ["what they want"],
  "trust_edges": [{"target": "name", "level": "high|medium|low|broken"}],
  "internal_conflicts": ["unresolved tensions"],
  "arc_phase": "setup|rising|climax|falling|resolved",
  "arc_hint": "brief arc direction",
  "out_of_character_risk": "low|medium|high - how easily they might act against established traits",
  "inference_confidence": 0.0-1.0
}`;

    try {
      const resp = await getClient().chat.completions.create({
        model: config.openaiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });
      let content = (resp.choices[0]?.message?.content || "").trim();
      if (content.startsWith("```")) {
        const lines = content.split("\n");
        content = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
      }
      const inferred = JSON.parse(content);
      const merged = {
        ...existing,
        goals: inferred.goals ?? existing.goals,
        fears: inferred.fears ?? existing.fears,
        beliefs: inferred.beliefs ?? existing.beliefs,
        loyalties: inferred.loyalties ?? existing.loyalties,
        desires: inferred.desires ?? existing.desires,
        trust_edges: inferred.trust_edges ?? existing.trust_edges,
        internal_conflicts: inferred.internal_conflicts ?? existing.internal_conflicts,
        arc_phase: inferred.arc_phase ?? existing.arc_phase,
        arc_hint: inferred.arc_hint ?? existing.arc_hint,
        out_of_character_risk: inferred.out_of_character_risk ?? existing.out_of_character_risk,
        inference_confidence: inferred.inference_confidence ?? 0.7,
      };

      await this.narrativeRepo.updateObjectMetadata(objectId, merged).catch(() => {});

      return {
        id: obj.id,
        name: obj.name,
        summary: obj.summary,
        metadata: merged,
        relationships: edges.map((e) => ({
          type: e.edge_type,
          other: e.source_id === objectId ? e.target_name : e.source_name,
        })),
        knowledge,
      };
    } catch {
      return {
        id: obj.id,
        name: obj.name,
        summary: obj.summary,
        metadata: existing,
        relationships: edges.map((e) => ({
          type: e.edge_type,
          other: e.source_id === objectId ? e.target_name : e.source_name,
        })),
        knowledge,
      };
    }
  }

  async listCharacters(userId) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const objects = await this.narrativeRepo.findObjectsByProject(project.id, "character");
    return objects.map((o) => ({
      id: o.id,
      name: o.name,
      summary: o.summary,
      metadata: o.metadata,
    }));
  }
}
