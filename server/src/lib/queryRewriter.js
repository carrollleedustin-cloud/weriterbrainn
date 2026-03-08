/**
 * Optional query rewriting for improved retrieval.
 * Expands/rephrases user query into search-optimized form.
 */
import OpenAI from "openai";
import { config } from "../../config.js";
import { logger } from "./logger.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

const REWRITE_PROMPT = `Rewrite the following user message into 1-2 concise search queries that would best find relevant memories. Output only the search queries, one per line, no numbering or explanation. Keep it short.`;

/**
 * Rewrite user query for better retrieval.
 * @param {string} userMessage
 * @returns {Promise<string>} Original message if rewrite fails/skipped, else rewritten query
 */
export async function rewriteQueryForRetrieval(userMessage) {
  if (!userMessage?.trim()) return userMessage || "";
  if (!config.openaiApiKey) return userMessage;

  try {
    const resp = await getClient().chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: "system", content: REWRITE_PROMPT },
        { role: "user", content: userMessage.slice(0, 500) },
      ],
      temperature: 0.2,
      max_tokens: 100,
    });
    const content = (resp.choices[0]?.message?.content || "").trim();
    if (!content) return userMessage;
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines[0] || userMessage;
  } catch (err) {
    logger.debug("Query rewrite failed, using original", { error: err?.message });
    return userMessage;
  }
}
