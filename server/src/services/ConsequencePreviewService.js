import OpenAI from "openai";
import { config } from "../../config.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

/**
 * Consequence Preview V2: ripple-analysis decision engine.
 * Impacted facts, events, threads, knowledge states; blast radius by scope; risk/opportunity scores.
 */
export class ConsequencePreviewService {
  constructor({ narrativeRepository, storyCompilerService, canonLedgerService = null }) {
    this.narrativeRepo = narrativeRepository;
    this.storyCompiler = storyCompilerService;
    this.canonLedger = canonLedgerService;
  }

  async preview(proposedText, existingContext, userId) {
    if (!proposedText?.trim()) {
      return this.emptyPreview("No text to preview.");
    }
    if (!config.openaiApiKey) {
      return this.emptyPreview("Preview unavailable.");
    }

    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const [objects, edges] = await Promise.all([
      this.narrativeRepo.findObjectsByProject(project.id),
      this.narrativeRepo.findEdgesByProject(project.id),
    ]);

    const chars = objects.filter((o) => (o.object_type || "").toLowerCase() === "character");
    const threads = objects.filter((o) => (o.object_type || "").toLowerCase() === "plot_thread");
    const events = objects.filter((o) => (o.object_type || "").toLowerCase() === "event");

    let canonFacts = [];
    if (this.canonLedger) {
      try {
        canonFacts = await this.canonLedger.buildCanonContextForCompiler(project.id);
      } catch {
        canonFacts = [];
      }
    }

    const compileResult = await this.storyCompiler.compile(proposedText, userId);

    const prompt = `You are a Consequence Preview V2 engine. Given proposed new text and existing story state, produce a structured ripple analysis.

EXISTING STATE:
Characters: ${chars.map((c) => c.name).join(", ")}
Plot threads: ${threads.map((t) => `${t.name} (${t.metadata?.status || "?"})`).join(", ")}
Events: ${events.slice(0, 15).map((e) => e.name).join(", ")}
Canon facts (excerpt): ${canonFacts.slice(0, 10).map((f) => f.fact_value?.slice(0, 60)).join("; ")}

COMPILER ISSUES from new text:
${JSON.stringify(compileResult.issues || compileResult.alerts || [], null, 2)}

PROPOSED NEW TEXT:
${proposedText.slice(0, 4500)}

EXISTING CONTEXT: ${existingContext || "N/A"}

Produce a structured ripple analysis. Output JSON only:
{
  "impacted_canon_facts": [{"fact_id": "or null", "fact_value": "excerpt", "impact": "unchanged|contradicted|superseded|reinforced"}],
  "impacted_events": [{"name": "...", "impact": "unchanged|invalidated|shifted|new_cause"}],
  "impacted_threads": [{"name": "...", "impact": "unchanged|advanced|blocked|resolved|broken"}],
  "impacted_characters": [{"name": "...", "impact": "unchanged|knowledge_change|arc_shift|contradiction"}],
  "impacted_knowledge": [{"character": "...", "fact": "...", "change": "gained|lost|suspected"}],
  "impacts": [{"type": "plot_thread|character|setup|knowledge|continuity|opportunity", "target": "...", "description": "...", "severity": "low|medium|high", "opportunity": false}],
  "blast_radius": {"scene": 0, "chapter": 0, "book": 0, "universe": 0},
  "risk_score": 0.0-1.0,
  "opportunity_score": 0.0-1.0,
  "summary": "1-2 sentence assessment",
  "delta_summary": "before vs after in one sentence"
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
        impacted_canon_facts: data.impacted_canon_facts || [],
        impacted_events: data.impacted_events || [],
        impacted_threads: data.impacted_threads || [],
        impacted_characters: data.impacted_characters || [],
        impacted_knowledge: data.impacted_knowledge || [],
        impacts: data.impacts || [],
        blast_radius: data.blast_radius || { scene: 0, chapter: 0, book: 0, universe: 0 },
        risk_score: Math.min(1, Math.max(0, parseFloat(data.risk_score) || 0)),
        opportunity_score: Math.min(1, Math.max(0, parseFloat(data.opportunity_score) || 0)),
        summary: data.summary || "",
        delta_summary: data.delta_summary || "",
        compile_alerts: compileResult.alerts || [],
        compile_issues: compileResult.issues || [],
      };
    } catch (err) {
      console.error("ConsequencePreview error:", err);
      return this.emptyPreview("Could not generate preview.", compileResult);
    }
  }

  emptyPreview(message, compileResult = null) {
    return {
      impacted_canon_facts: [],
      impacted_events: [],
      impacted_threads: [],
      impacted_characters: [],
      impacted_knowledge: [],
      impacts: [],
      blast_radius: { scene: 0, chapter: 0, book: 0, universe: 0 },
      risk_score: 0,
      opportunity_score: 0,
      summary: message,
      delta_summary: "",
      compile_alerts: compileResult?.alerts || [],
      compile_issues: compileResult?.issues || [],
    };
  }
}
