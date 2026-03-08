import OpenAI from "openai";
import { config } from "../../config.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

/**
 * Story Strategist: high-level planning, pacing, thread weaving, payoff timing.
 */
export class StoryStrategistService {
  constructor({ narrativeRepository, plotThreadService }) {
    this.narrativeRepo = narrativeRepository;
    this.plotThreadService = plotThreadService;
  }

  async getStrategy(userId, focus = null) {
    if (!config.openaiApiKey) {
      return { summary: "OpenAI key not configured.", suggestions: [], opportunities: [] };
    }

    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const [objects, edges, threadSummary] = await Promise.all([
      this.narrativeRepo.findObjectsByProject(project.id),
      this.narrativeRepo.findEdgesByProject(project.id),
      this.plotThreadService.getThreadSummary(userId),
    ]);

    const chars = objects.filter((o) => (o.object_type || "").toLowerCase() === "character");
    const threads = objects.filter((o) => (o.object_type || "").toLowerCase() === "plot_thread");
    const events = objects.filter((o) => (o.object_type || "").toLowerCase() === "event");

    const prompt = `You are a Story Strategist. Analyze this story universe and provide strategic guidance.

STORY STATE:
- Characters: ${chars.length}
- Plot threads: ${threads.length} (active: ${threadSummary.active_count})
- Events: ${events.length}

Characters: ${chars.map((c) => c.name).join(", ")}
Plot threads: ${threads.map((t) => `${t.name} (${t.metadata?.status || "?"})`).join(", ")}

${focus ? `Author focus: ${focus}` : ""}

Provide:
1. Brief structural summary
2. 3-5 tactical suggestions (underused characters, neglected conflicts, weak middle, payoff timing, etc.)
3. 2-3 opportunities (resonance, foreshadowing, tension)

Respond with JSON:
{
  "summary": "1-2 sentences",
  "suggestions": [{"title": "...", "description": "...", "priority": "high|medium|low"}],
  "opportunities": [{"title": "...", "description": "..."}]
}`;

    try {
      const resp = await getClient().chat.completions.create({
        model: config.openaiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      });
      let content = (resp.choices[0]?.message?.content || "").trim();
      if (content.startsWith("```")) {
        const lines = content.split("\n");
        content = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
      }
      const data = JSON.parse(content);
      return {
        summary: data.summary || "",
        suggestions: data.suggestions || [],
        opportunities: data.opportunities || [],
      };
    } catch {
      return { summary: "", suggestions: [], opportunities: [] };
    }
  }
}
