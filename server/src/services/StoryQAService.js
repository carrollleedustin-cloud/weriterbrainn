import OpenAI from "openai";
import { config } from "../../config.js";
import { NarrativeRepository } from "../repositories/NarrativeRepository.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

/**
 * Story Q&A: natural-language queries over the narrative universe with citations.
 */
export class StoryQAService {
  constructor({ narrativeRepository, embeddingService }) {
    this.narrativeRepo = narrativeRepository;
    this.embeddingService = embeddingService;
  }

  async buildContext(projectId) {
    const [objects, edges, canonEvents] = await Promise.all([
      this.narrativeRepo.findObjectsByProject(projectId),
      this.narrativeRepo.findEdgesByProject(projectId),
      this.narrativeRepo.findCanonLedgerEvents(projectId, 80),
    ]);
    const idToObj = new Map(objects.map((o) => [o.id, o]));
    const edgeStr = edges
      .map((e) => {
        const s = idToObj.get(e.source_id);
        const t = idToObj.get(e.target_id);
        return s && t ? `${s.name} --[${e.edge_type}]--> ${t.name}` : null;
      })
      .filter(Boolean)
      .join("\n");
    const canonStr = canonEvents
      .filter((ev) => (ev.event_type || "").toLowerCase() === "canon_established")
      .map((ev) => ev.payload?.fact)
      .filter(Boolean)
      .join("\n");
    return {
      objects: objects.map((o) => ({
        type: o.object_type,
        name: o.name,
        summary: o.summary,
        metadata: o.metadata,
      })),
      edges: edgeStr,
      canon: canonStr,
    };
  }

  async ask(question, userId) {
    if (!question?.trim() || !config.openaiApiKey) {
      return { answer: "Unable to answer.", citations: [], confidence: 0 };
    }

    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const context = await this.buildContext(project.id);

    const prompt = `You are a Story Q&A system. Answer the question using ONLY the provided story universe data. Cite specific objects/facts.

STORY UNIVERSE:
Objects: ${JSON.stringify(context.objects)}
Relationships: ${context.edges}
Canon facts: ${context.canon}

QUESTION: ${question}

Respond with JSON:
{
  "answer": "direct answer with evidence",
  "citations": [{"type": "object|canon|edge", "name": "...", "excerpt": "relevant text"}],
  "confidence": 0.0-1.0
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
      const data = JSON.parse(content);
      return {
        answer: data.answer || "No answer found.",
        citations: data.citations || [],
        confidence: data.confidence ?? 0.5,
      };
    } catch {
      return { answer: "Could not process the question.", citations: [], confidence: 0 };
    }
  }
}
