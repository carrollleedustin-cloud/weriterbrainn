import OpenAI from "openai";
import { config } from "../../config.js";
import { RagService } from "./RagService.js";

const SYSTEM_PROMPT = `You are a personal AI brain—a thinking partner that remembers and learns from the user.
Use the provided context (memories, knowledge graph, conversation history) to give relevant, personalized responses.
Be concise but thoughtful. Match the user's communication style when evident from context or persona metrics.`;

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

function personaPrompt(metrics) {
  const hints = [];
  if (metrics.avg_sentence_length != null)
    hints.push(`User tends to use ~${Math.round(metrics.avg_sentence_length)} words per sentence.`);
  if (metrics.vocab_complexity != null)
    hints.push(`Vocabulary diversity: ${metrics.vocab_complexity.toFixed(2)}.`);
  return hints.length ? "\nPersona: " + hints.join(" ") : "";
}

export class ChatService {
  constructor({ ragService }) {
    this.ragService = ragService;
  }

  async chatWithContext(message, userId, conversationId) {
    if (!config.openaiApiKey) {
      return "OpenAI API key is not configured. Please set OPENAI_API_KEY.";
    }
    const { contextStr, persona } = await this.ragService.buildContext({
      message,
      userId,
      conversationId,
    });
    const systemContent = SYSTEM_PROMPT + personaPrompt(persona);
    const userContent = `Context:\n${contextStr}\n\nUser message: ${message}`;

    const resp = await getClient().chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
    });
    return (resp.choices[0]?.message?.content || "").trim();
  }

  async *chatStream(message, userId, conversationId) {
    if (!config.openaiApiKey) {
      yield "OpenAI API key is not configured.";
      return;
    }
    const { contextStr, persona } = await this.ragService.buildContext({
      message,
      userId,
      conversationId,
    });
    const systemContent = SYSTEM_PROMPT + personaPrompt(persona);
    const userContent = `Context:\n${contextStr}\n\nUser message: ${message}`;

    const stream = await getClient().chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
