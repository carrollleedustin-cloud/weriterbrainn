import OpenAI from "openai";
import { config } from "../../config.js";
import { RagService } from "./RagService.js";
import {
  sanitizeUserInput,
  wrapUserContent,
  detectInjection,
} from "../lib/promptInjectionGuard.js";
import { logger } from "../lib/logger.js";

const SYSTEM_PROMPT = `You are a personal AI brain—a thinking partner that remembers and learns from the user.
Use the provided context (memories, knowledge graph, conversation history) to give relevant, personalized responses.
Be concise but thoughtful. Adapt your tone and style to match the user's preferences.
When you use information from the relevant memories, cite the source with [1], [2], etc. matching the numbered list in context.`;

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

import { buildPersonaPrompt } from "../lib/personaPrompt.js";

export class ChatService {
  constructor({ ragService, personaService }) {
    this.ragService = ragService;
    this.personaService = personaService;
  }

  async chatWithContext(message, userId, conversationId) {
    if (!config.openaiApiKey) {
      return { response: "OpenAI API key is not configured. Please set OPENAI_API_KEY.", citations: [] };
    }
    const sanitized = sanitizeUserInput(message);
    const { detected } = detectInjection(message);
    if (detected) {
      logger.info("Prompt injection detected", { userId });
    }
    const [{ contextStr, citations }, cognitiveProfile] = await Promise.all([
      this.ragService.buildContext({
        message: sanitized,
        userId,
        conversationId,
      }),
      this.personaService?.getCognitiveProfile(userId) ?? Promise.resolve(null),
    ]);
    const personaHints = buildPersonaPrompt(cognitiveProfile);
    const systemContent = SYSTEM_PROMPT + personaHints;
    const userContent = `Context:\n${contextStr}\n\n${wrapUserContent(sanitized)}`;

    const resp = await getClient().chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
    });
    const response = (resp.choices[0]?.message?.content || "").trim();
    return { response, citations: citations || [] };
  }

  async chatStream(message, userId, conversationId) {
    if (!config.openaiApiKey) {
      return { citations: [], async *stream() { yield "OpenAI API key is not configured."; } };
    }
    const sanitized = sanitizeUserInput(message);
    const { detected } = detectInjection(message);
    if (detected) {
      logger.info("Prompt injection detected", { userId });
    }
    const [{ contextStr, citations }, cognitiveProfile] = await Promise.all([
      this.ragService.buildContext({
        message: sanitized,
        userId,
        conversationId,
      }),
      this.personaService?.getCognitiveProfile(userId) ?? Promise.resolve(null),
    ]);
    const personaHints = buildPersonaPrompt(cognitiveProfile);
    const systemContent = SYSTEM_PROMPT + personaHints;
    const userContent = `Context:\n${contextStr}\n\n${wrapUserContent(sanitized)}`;

    const stream = await getClient().chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      stream: true,
    });

    return {
      citations: citations || [],
      async *stream() {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        }
      },
    };
  }
}
