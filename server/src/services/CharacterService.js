import OpenAI from "openai";
import { config } from "../../config.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

/**
 * Character intelligence: goals, fears, knowledge state, arcs.
 * Enriches narrative character objects with LLM-inferred psychology.
 */
export class CharacterService {
  constructor({ narrativeRepository }) {
    this.narrativeRepo = narrativeRepository;
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

    const existing = obj.metadata?.goals
      ? { goals: obj.metadata.goals, fears: obj.metadata.fears, knowledge: obj.metadata.knowledge }
      : null;

    if (!config.openaiApiKey) {
      return {
        id: obj.id,
        name: obj.name,
        summary: obj.summary,
        metadata: obj.metadata || {},
        relationships: edges.map((e) => ({
          type: e.edge_type,
          other: e.source_id === objectId ? e.target_name : e.source_name,
        })),
      };
    }

    const prompt = `Infer character psychology from this story data. Output JSON only.

Character: ${obj.name}
Summary: ${obj.summary || "N/A"}
Relationships: ${edgesStr || "None"}

${existing ? `Existing metadata: ${JSON.stringify(existing)}` : ""}

Infer and output:
{
  "goals": ["2-4 character goals or motivations"],
  "fears": ["1-3 fears or vulnerabilities"],
  "knowledge": ["what they know / don't know that matters"],
  "arc_hint": "brief arc direction if evident"
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
      return {
        id: obj.id,
        name: obj.name,
        summary: obj.summary,
        metadata: { ...obj.metadata, ...inferred },
        relationships: edges.map((e) => ({
          type: e.edge_type,
          other: e.source_id === objectId ? e.target_name : e.source_name,
        })),
      };
    } catch {
      return {
        id: obj.id,
        name: obj.name,
        summary: obj.summary,
        metadata: obj.metadata || {},
        relationships: edges.map((e) => ({
          type: e.edge_type,
          other: e.source_id === objectId ? e.target_name : e.source_name,
        })),
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
