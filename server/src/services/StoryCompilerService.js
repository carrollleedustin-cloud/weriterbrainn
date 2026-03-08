import OpenAI from "openai";
import { config } from "../../config.js";
import { NarrativeRepository } from "../repositories/NarrativeRepository.js";
import { NarrativeExtractionService } from "./NarrativeExtractionService.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

const ALERT_TIERS = Object.freeze({
  soft_risk: "soft_risk",
  likely_contradiction: "likely_contradiction",
  canon_break: "canon_break",
  strategic_opportunity: "strategic_opportunity",
});

/**
 * Story Compiler: validates new text against existing canon.
 * Detects: dead chars alive, timeline impossibilities, lore violations, knowledge leaks, etc.
 */
export class StoryCompilerService {
  constructor({ narrativeRepository, narrativeExtractionService }) {
    this.narrativeRepo = narrativeRepository;
    this.extractionService = narrativeExtractionService;
  }

  async buildCanonContext(projectId) {
    const [objects, events] = await Promise.all([
      this.narrativeRepo.findObjectsByProject(projectId),
      this.narrativeRepo.findCanonLedgerEvents(projectId, 50),
    ]);
    const chars = objects.filter((o) => (o.object_type || "").toLowerCase() === "character");
    const evts = objects.filter((o) => (o.object_type || "").toLowerCase() === "event");
    const threads = objects.filter((o) => (o.object_type || "").toLowerCase() === "plot_thread");
    const lore = objects.filter((o) => (o.object_type || "").toLowerCase() === "lore_rule");
    const canonFacts = events.filter((e) => (e.event_type || "").toLowerCase() === "canon_established");

    const summary = {
      characters: chars.map((c) => ({
        name: c.name,
        summary: c.summary,
        metadata: c.metadata,
        canon_state: c.canon_state,
      })),
      events: evts.map((e) => ({
        name: e.name,
        summary: e.summary,
        metadata: e.metadata,
        created_at: e.created_at,
      })),
      plot_threads: threads.map((t) => ({
        name: t.name,
        status: t.metadata?.status,
        summary: t.summary,
      })),
      lore_rules: lore.map((l) => ({ name: l.name, summary: l.summary })),
      canon_facts: canonFacts.map((e) => e.payload?.fact).filter(Boolean),
    };
    return summary;
  }

  async compile(text, userId) {
    if (!text?.trim()) return { alerts: [], tier: "ok" };
    if (!config.openaiApiKey) return { alerts: [], tier: "ok" };

    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const canonContext = await this.buildCanonContext(project.id);
    const extracted = await this.extractionService.extractNarrative(text);

    const prompt = `You are a Story Compiler. Check the NEW TEXT for continuity issues against the existing CANON.

CANON (established story elements):
${JSON.stringify(canonContext, null, 2)}

NEW TEXT (draft to validate):
${text.slice(0, 8000)}

EXTRACTED from new text:
${JSON.stringify(extracted, null, 2)}

Check for:
- Dead characters appearing alive without explanation
- Timeline impossibilities
- Lore rule violations
- Secret/knowledge leakage
- Relationship inconsistencies
- Broken promise/payoff chains
- Contradictions with canon_facts

Respond with JSON only:
{
  "alerts": [
    {
      "tier": "soft_risk|likely_contradiction|canon_break|strategic_opportunity",
      "summary": "brief description",
      "confidence": 0.0-1.0,
      "source_passage": "relevant snippet from new text or null",
      "related_canon": "related established fact",
      "suggested_resolution": "optional fix"
    }
  ],
  "overall_tier": "ok|soft_risk|likely_contradiction|canon_break"
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
      const alerts = (data.alerts || []).map((a) => ({
        ...a,
        tier: a.tier || "soft_risk",
      }));
      return {
        alerts,
        overall_tier: data.overall_tier || "ok",
        canon_summary: canonContext,
      };
    } catch {
      return { alerts: [], overall_tier: "ok", canon_summary: canonContext };
    }
  }
}
