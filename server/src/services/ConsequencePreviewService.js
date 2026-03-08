import OpenAI from "openai";
import { config } from "../../config.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

/**
 * Consequence Preview: before accepting a major edit, show ripple effects.
 * Impacted threads, characters, setups, knowledge states.
 */
export class ConsequencePreviewService {
  constructor({ narrativeRepository, storyCompilerService }) {
    this.narrativeRepo = narrativeRepository;
    this.storyCompiler = storyCompilerService;
  }

  async preview(proposedText, existingContext, userId) {
    if (!proposedText?.trim()) return { impacts: [], summary: "No text to preview." };
    if (!config.openaiApiKey) return { impacts: [], summary: "Preview unavailable." };

    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const [objects, edges] = await Promise.all([
      this.narrativeRepo.findObjectsByProject(project.id),
      this.narrativeRepo.findEdgesByProject(project.id),
    ]);

    const chars = objects.filter((o) => (o.object_type || "").toLowerCase() === "character");
    const threads = objects.filter((o) => (o.object_type || "").toLowerCase() === "plot_thread");

    const compileResult = await this.storyCompiler.compile(proposedText, userId);

    const prompt = `You are a Consequence Preview engine. Given proposed new text and existing story state, list potential ripple effects.

EXISTING STATE:
Characters: ${chars.map((c) => c.name).join(", ")}
Plot threads: ${threads.map((t) => `${t.name} (${t.metadata?.status || "?"})`).join(", ")}
Compilation alerts from new text: ${JSON.stringify(compileResult.alerts || [])}

PROPOSED NEW TEXT (excerpt):
${proposedText.slice(0, 4000)}

EXISTING CONTEXT (optional): ${existingContext || "N/A"}

List impacts. Output JSON only:
{
  "impacts": [
    {
      "type": "plot_thread|character|setup|knowledge|continuity",
      "target": "name or id",
      "description": "what changes",
      "severity": "low|medium|high",
      "opportunity": false
    }
  ],
  "summary": "1-2 sentence overall assessment"
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
        impacts: data.impacts || [],
        summary: data.summary || "",
        compile_alerts: compileResult.alerts || [],
      };
    } catch {
      return {
        impacts: [],
        summary: "Could not generate preview.",
        compile_alerts: compileResult.alerts || [],
      };
    }
  }
}
