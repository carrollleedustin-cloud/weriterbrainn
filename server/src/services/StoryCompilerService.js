import { randomUUID } from "crypto";
import OpenAI from "openai";
import { config } from "../../config.js";
import { NarrativeRepository } from "../repositories/NarrativeRepository.js";
import { NarrativeExtractionService } from "./NarrativeExtractionService.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

const CATEGORIES = Object.freeze([
  "timeline",
  "lore",
  "character",
  "knowledge",
  "relationship",
  "setup_payoff",
  "style",
  "other",
]);

const SEVERITIES = Object.freeze(["critical", "high", "medium", "low", "info"]);

const TIER_TO_SEVERITY = Object.freeze({
  canon_break: "critical",
  likely_contradiction: "high",
  soft_risk: "medium",
  strategic_opportunity: "low",
});

/**
 * Story Compiler V2: staged validation, richer output, explanation path.
 * Categories: timeline, lore, character, knowledge, relationship, setup_payoff, style.
 */
export class StoryCompilerService {
  constructor({ narrativeRepository, narrativeExtractionService, canonLedgerService = null }) {
    this.narrativeRepo = narrativeRepository;
    this.extractionService = narrativeExtractionService;
    this.canonLedger = canonLedgerService;
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
    let structuredFacts = [];
    if (this.canonLedger) {
      try {
        structuredFacts = await this.canonLedger.buildCanonContextForCompiler(projectId);
      } catch {
        structuredFacts = [];
      }
    }

    return {
      characters: chars.map((c) => ({
        id: c.id,
        name: c.name,
        summary: c.summary,
        metadata: c.metadata,
        canon_state: c.canon_state,
      })),
      events: evts.map((e) => ({
        id: e.id,
        name: e.name,
        summary: e.summary,
        metadata: e.metadata,
        created_at: e.created_at,
      })),
      plot_threads: threads.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.metadata?.status,
        summary: t.summary,
      })),
      lore_rules: lore.map((l) => ({ id: l.id, name: l.name, summary: l.summary })),
      canon_facts: canonFacts.map((e) => e.payload?.fact).filter(Boolean),
      structured_facts: structuredFacts,
    };
  }

  async compile(text, userId) {
    if (!text?.trim()) {
      return this.emptyResult();
    }
    if (!config.openaiApiKey) {
      return this.emptyResult();
    }

    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const canonContext = await this.buildCanonContext(project.id);
    const extracted = await this.extractionService.extractNarrative(text);

    const canonFactsUsed = canonContext.structured_facts?.map((f) => ({
      id: f.id,
      value: f.fact_value?.slice(0, 100),
    })) || [];

    const prompt = `You are a Story Compiler V2. Validate NEW TEXT against CANON in these categories:
1. timeline — ordering, causality, temporal impossibilities
2. lore — world rules, constraints
3. character — dead/alive, behavior plausibility, out-of-character
4. knowledge — secret leakage, who-knows-what violations
5. relationship — consistency with established connections
6. setup_payoff — broken promises, unresolved setups
7. style — tone/thematic drift (lower priority)

CANON:
${JSON.stringify(canonContext, null, 2)}

NEW TEXT:
${text.slice(0, 8000)}

EXTRACTED from new text:
${JSON.stringify(extracted, null, 2)}

For each issue found, output:
- category (timeline|lore|character|knowledge|relationship|setup_payoff|style|other)
- severity (critical|high|medium|low|info)
- summary
- confidence 0-1
- affected_entities (array of character/object names)
- evidence (brief quote or description)
- source_passage (snippet from new text if relevant)
- related_canon (which canon fact this contradicts or relates to)
- suggested_resolution

Respond with JSON only:
{
  "issues": [
    {
      "category": "timeline|lore|character|...",
      "severity": "critical|high|medium|low|info",
      "summary": "...",
      "confidence": 0.9,
      "affected_entities": ["Marcus", "The Secret"],
      "evidence": "...",
      "source_passage": "optional snippet",
      "related_canon": "...",
      "suggested_resolution": "..."
    }
  ],
  "overall_severity": "ok|low|medium|high|critical"
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
      const issues = (data.issues || []).map((iss) => ({
        issue_id: randomUUID(),
        category: CATEGORIES.includes(iss.category) ? iss.category : "other",
        severity: SEVERITIES.includes(iss.severity) ? iss.severity : "medium",
        summary: iss.summary || "Continuity issue",
        confidence: Math.min(1, Math.max(0, parseFloat(iss.confidence) || 0.7)),
        affected_entities: Array.isArray(iss.affected_entities) ? iss.affected_entities : [],
        evidence: iss.evidence || null,
        source_passage: iss.source_passage || null,
        related_canon: iss.related_canon || null,
        suggested_resolution: iss.suggested_resolution || null,
      }));

      const overallSeverity = data.overall_severity || "ok";
      const overallTier = this.severityToTier(overallSeverity);

      const alerts = issues.map((i) => ({
        tier: this.severityToTier(i.severity),
        summary: i.summary,
        confidence: i.confidence,
        source_passage: i.source_passage,
        related_canon: i.related_canon,
        suggested_resolution: i.suggested_resolution,
      }));

      return {
        issues,
        overall_severity: overallSeverity,
        overall_tier: overallTier,
        alerts,
        explanation_path: {
          stages_run: ["entity_resolution", "fact_extraction", "canon_lookup", "validation"],
          canon_facts_used: canonFactsUsed,
          issue_count: issues.length,
        },
        canon_summary: canonContext,
      };
    } catch (err) {
      console.error("StoryCompiler compile error:", err);
      return this.emptyResult(canonContext);
    }
  }

  severityToTier(severity) {
    if (severity === "critical") return "canon_break";
    if (severity === "high") return "likely_contradiction";
    if (severity === "medium") return "soft_risk";
    if (severity === "low" || severity === "info") return "strategic_opportunity";
    return "ok";
  }

  emptyResult(canonContext = null) {
    return {
      issues: [],
      overall_severity: "ok",
      overall_tier: "ok",
      alerts: [],
      explanation_path: { stages_run: [], canon_facts_used: [], issue_count: 0 },
      canon_summary: canonContext,
    };
  }
}
