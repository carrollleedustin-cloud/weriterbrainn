import OpenAI from "openai";
import { config } from "../config.js";
import { searchMemories } from "./memory.js";
import { query } from "../db.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

async function getRecentMessages(conversationId, limit = 10) {
  const r = await query(
    `SELECT role, content FROM conversation_messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [conversationId, limit]
  );
  return r.rows.reverse().map((row) => `${row.role}: ${row.content}`);
}

async function searchKgEntities(q, userId, limit = 5) {
  if (!q?.trim()) return [];
  const term = `%${q.trim()}%`;
  const r = await query(
    `SELECT id, name, node_type, description FROM knowledge_graph_nodes
     WHERE (name ILIKE $1 OR (description IS NOT NULL AND description ILIKE $1))
       AND ($2::uuid IS NULL OR user_id = $2)
     LIMIT $3`,
    [term, userId, limit]
  );
  return r.rows;
}

async function getRelatedEntities(nodeIds, limit = 5) {
  if (!nodeIds?.length) return [];
  const placeholders = nodeIds.map((_, i) => `$${i + 1}`).join(",");
  const r = await query(
    `SELECT source_id, target_id FROM knowledge_graph_edges
     WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})
     LIMIT ${limit * 2}`,
    nodeIds
  );
  const relatedIds = new Set();
  for (const row of r.rows) {
    if (!nodeIds.includes(row.source_id)) relatedIds.add(row.source_id);
    if (!nodeIds.includes(row.target_id)) relatedIds.add(row.target_id);
  }
  if (!relatedIds.size) return [];
  const ids = [...relatedIds].slice(0, limit);
  const ph = ids.map((_, i) => `$${i + 1}`).join(",");
  const r2 = await query(
    `SELECT id, name, node_type, description FROM knowledge_graph_nodes WHERE id IN (${ph})`,
    ids
  );
  return r2.rows;
}

async function buildRagContext(message, userId, conversationId, memoryTopK = 5) {
  const memResults = await searchMemories(message, memoryTopK, userId);
  const memoryChunks = memResults.map((row) => row.chunk_text);
  let conversationRecent = [];
  if (conversationId) {
    conversationRecent = await getRecentMessages(conversationId, 6);
  }
  const kgNodes = await searchKgEntities(message, userId, 5);
  let kgEntities = [];
  if (kgNodes.length) {
    const related = await getRelatedEntities(kgNodes.map((n) => n.id), 3);
    const all = [...kgNodes, ...related].slice(0, 7);
    kgEntities = all.map((n) => {
      const desc = n.description ? ` (${n.description})` : "";
      return `- ${n.name} [${n.node_type}]${desc}`;
    });
  }
  const parts = [];
  if (memoryChunks.length) parts.push("Relevant memories:\n" + memoryChunks.map((c) => `- ${c}`).join("\n"));
  if (conversationRecent.length) parts.push("Recent conversation:\n" + conversationRecent.join("\n"));
  if (kgEntities.length) parts.push("Related knowledge:\n" + kgEntities.join("\n"));
  const contextStr = parts.length ? parts.join("\n\n") : "(No relevant context found.)";
  return contextStr;
}

async function getPersonaSummary(userId) {
  const r = await query(
    "SELECT metric_name, metric_value FROM persona_metrics WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1",
    [userId]
  );
  const metrics = {};
  for (const row of r.rows) metrics[row.metric_name] = row.metric_value;
  return metrics;
}

const SYSTEM_PROMPT = `You are a personal AI brain—a thinking partner that remembers and learns from the user.
Use the provided context (memories, knowledge graph, conversation history) to give relevant, personalized responses.
Be concise but thoughtful. Match the user's communication style when evident from context or persona metrics.`;

function personaPrompt(metrics) {
  const hints = [];
  if (metrics.avg_sentence_length != null)
    hints.push(`User tends to use ~${Math.round(metrics.avg_sentence_length)} words per sentence.`);
  if (metrics.vocab_complexity != null)
    hints.push(`Vocabulary diversity: ${metrics.vocab_complexity.toFixed(2)}.`);
  return hints.length ? "\nPersona: " + hints.join(" ") : "";
}

export async function chatWithContext(message, userId, conversationId) {
  if (!config.openaiApiKey) return "OpenAI API key is not configured. Please set OPENAI_API_KEY.";
  const contextStr = await buildRagContext(message, userId, conversationId);
  const persona = await getPersonaSummary(userId);
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

export async function* chatStream(message, userId, conversationId) {
  if (!config.openaiApiKey) {
    yield "OpenAI API key is not configured.";
    return;
  }
  const contextStr = await buildRagContext(message, userId, conversationId);
  const persona = await getPersonaSummary(userId);
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
