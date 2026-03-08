import OpenAI from "openai";
import { config } from "../../config.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

/**
 * Story Q&A V2: graph-aware, timeline-aware, knowledge-aware answers.
 * Structured results: answer, confidence, citations, reasoning, related entities, ambiguity, contradictory evidence.
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
        id: o.id,
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
    if (!question?.trim()) {
      return this.emptyAnswer();
    }
    if (!config.openaiApiKey) {
      return this.emptyAnswer();
    }

    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const context = await this.buildContext(project.id);

    const prompt = `You are Story Q&A V2. Answer using ONLY the provided story universe. Support multi-hop reasoning. Note ambiguity or contradictions if present.

STORY UNIVERSE:
Objects: ${JSON.stringify(context.objects)}
Relationships: ${context.edges}
Canon facts: ${context.canon}

QUESTION: ${question}

Respond with JSON only:
{
  "answer": "direct answer with evidence",
  "confidence": 0.0-1.0,
  "citations": [{"type": "object|canon|edge", "name": "...", "excerpt": "relevant text"}],
  "reasoning_summary": "brief chain of reasoning (1-2 sentences)",
  "related_entities": [{"name": "...", "role": "why relevant"}],
  "ambiguity_notes": ["any uncertainties or multiple interpretations"],
  "contradictory_evidence": ["conflicting facts if any"]
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
        confidence: Math.min(1, Math.max(0, data.confidence ?? 0.5)),
        citations: data.citations || [],
        reasoning_summary: data.reasoning_summary || null,
        related_entities: data.related_entities || [],
        ambiguity_notes: data.ambiguity_notes || [],
        contradictory_evidence: data.contradictory_evidence || [],
      };
    } catch (err) {
      console.error("StoryQAService ask error:", err);
      return this.emptyAnswer();
    }
  }

  emptyAnswer() {
    return {
      answer: "Unable to answer.",
      confidence: 0,
      citations: [],
      reasoning_summary: null,
      related_entities: [],
      ambiguity_notes: [],
      contradictory_evidence: [],
    };
  }
}
