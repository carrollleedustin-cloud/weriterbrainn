/**
 * NIO-OS API Service Layer
 *
 * All backend communication flows through the singleton ApiClient.
 * Each domain is exposed as a namespace of typed functions.
 */

import { api } from "./api-client";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type Citation = { index: number; memory_id: string; chunk_text: string };

export type EventCount = { date: string; event_type: string; count: string };

export type MemoryRecord = {
  id: string;
  content: string;
  memory_type: string;
  title?: string;
  tier?: string;
  created_at: string;
};

export type GraphNode = {
  id: string;
  name: string;
  node_type: string;
  summary?: string;
  metadata?: Record<string, unknown>;
};

export type GraphEdge = {
  source_id: string;
  target_id: string;
  edge_type: string;
  weight?: number;
};

export type NarrativeObject = {
  id: string;
  name: string;
  object_type: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  canon_state?: string;
  created_at?: string;
};

export type NarrativeEdge = {
  id?: string;
  source_id: string;
  target_id: string;
  edge_type: string;
};

export type TimelineEvent = {
  id: string;
  name: string;
  description?: string;
  summary?: string;
  timestamp?: string;
  temporal?: unknown;
  caused_by?: Array<{ event_id: string; name: string }>;
};

export type PlotThreadResponse = {
  threads: Array<{
    id: string;
    name: string;
    status: string;
    related_events?: string[];
  }>;
};

export type CharacterSummary = {
  id: string;
  name: string;
  summary?: string;
};

export type CharacterDetail = CharacterSummary & {
  metadata?: Record<string, unknown>;
  relationships?: Array<Record<string, unknown>>;
  knowledge?: Array<Record<string, unknown>>;
};

export type CanonFact = {
  id: string;
  fact?: string;
  fact_value?: string;
  fact_type: string;
  state?: string;
  canon_state?: string;
  confidence?: number;
  source?: string;
  source_passage?: string;
};

export type PersonaProfile = {
  avg_sentence_length?: number;
  vocab_complexity?: number;
  tone_score?: number;
  formality?: number;
  sentiment?: number;
  cognitive_profile?: Record<string, unknown>;
  [key: string]: unknown;
};

export type UserInfo = {
  id: string;
  email: string;
  display_name?: string;
};

export type StrategyResult = Record<string, unknown>;

export type SimulationResult = Record<string, unknown>;

export type EchoResult = Record<string, unknown>;

export type PreviewResult = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

const CACHE_SHORT = 30_000;
const CACHE_MEDIUM = 60_000;

export async function chat(
  message: string,
  conversationId?: string,
  stream = false
): Promise<Response> {
  return api.post<Response>(
    "/api/v1/chat/",
    { message, conversation_id: conversationId || null, stream },
    { raw: true }
  );
}

export async function chatJson(
  message: string,
  conversationId?: string
): Promise<{ response: string; conversation_id: string; citations: Citation[] }> {
  return api.post("/api/v1/chat/", {
    message,
    conversation_id: conversationId || null,
    stream: false,
  });
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function recordAnalytics(
  eventType: "response_accepted" | "response_regenerated" | "response_edited",
  payload?: Record<string, unknown>
) {
  return api.post("/api/v1/analytics/events", { event_type: eventType, payload });
}

export async function getAnalyticsInsights(
  days = 14
): Promise<{ event_counts: EventCount[] }> {
  return api.get("/api/v1/analytics/insights", {
    params: { days },
    cacheTtl: CACHE_SHORT,
  });
}

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------

export type MemorySearchResult = {
  memory: MemoryRecord;
  chunk_text: string;
  score: number;
};

export async function searchMemories(
  q: string,
  limit = 10,
  filters?: { memory_type?: string; tier?: string }
): Promise<{ results: MemorySearchResult[] }> {
  return api.get("/api/v1/memories/search", {
    params: { q, limit, memory_type: filters?.memory_type, tier: filters?.tier },
  });
}

export async function consolidateMemories(options?: {
  older_than_days?: number;
  batch_limit?: number;
}) {
  return api.post("/api/v1/memories/consolidate", options ?? {});
}

export async function createMemory(content: string, type = "note", title?: string) {
  return api.post<MemoryRecord>("/api/v1/memories/", { content, memory_type: type, title });
}

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------

export async function searchGraphEntities(q: string, limit = 10) {
  return api.get<{ results: GraphNode[] }>("/api/v1/graph/search", {
    params: { q, limit },
  });
}

export async function getGraphNodes() {
  return api.get<GraphNode[]>("/api/v1/graph/nodes", { cacheTtl: CACHE_MEDIUM });
}

export async function getGraphEdges() {
  return api.get<GraphEdge[]>("/api/v1/graph/edges", { cacheTtl: CACHE_MEDIUM });
}

export async function extractFromText(text: string) {
  return api.post("/api/v1/graph/extract", { text });
}

// ---------------------------------------------------------------------------
// Narrative
// ---------------------------------------------------------------------------

export async function narrativeExtract(text: string) {
  return api.post("/api/v1/narrative/extract", { text });
}

export async function getNarrativeProject() {
  return api.get("/api/v1/narrative/project", { cacheTtl: CACHE_MEDIUM });
}

export async function getNarrativeObjects(type?: string) {
  return api.get<NarrativeObject[]>("/api/v1/narrative/objects", {
    params: type ? { type } : undefined,
    cacheTtl: CACHE_MEDIUM,
  });
}

export async function getNarrativeEdges() {
  return api.get<NarrativeEdge[]>("/api/v1/narrative/edges", { cacheTtl: CACHE_MEDIUM });
}

export async function narrativeCompile(text: string) {
  return api.post("/api/v1/narrative/compile", { text });
}

export async function getNarrativeTimeline() {
  return api.get<{ events: TimelineEvent[] }>("/api/v1/narrative/timeline", {
    cacheTtl: CACHE_MEDIUM,
  });
}

export async function getNarrativePlotThreads() {
  return api.get<PlotThreadResponse>("/api/v1/narrative/plot-threads", {
    cacheTtl: CACHE_MEDIUM,
  });
}

export async function getNarrativeStrategy(focus?: string) {
  return api.get<StrategyResult>("/api/v1/narrative/strategy", {
    params: focus ? { focus } : undefined,
    cacheTtl: CACHE_SHORT,
  });
}

export async function narrativeAsk(q: string) {
  return api.get("/api/v1/narrative/ask", { params: { q } });
}

export async function oracleSimulate(character: string, situation: string) {
  return api.post<SimulationResult>("/api/v1/narrative/oracle/simulate", {
    character,
    situation,
  });
}

export async function storyEchoes(context: string) {
  return api.post<EchoResult>("/api/v1/narrative/echoes", { context });
}

export async function getNarrativeCharacters() {
  return api.get<CharacterSummary[]>("/api/v1/narrative/characters", {
    cacheTtl: CACHE_MEDIUM,
  });
}

export async function getCharacterDetails(objectId: string) {
  return api.get<CharacterDetail>(`/api/v1/narrative/characters/${objectId}`, {
    cacheTtl: CACHE_SHORT,
  });
}

export async function getCanonFacts(params?: { state?: string; type?: string }) {
  return api.get<{ facts: CanonFact[] }>("/api/v1/narrative/canon/facts", {
    params: params ?? undefined,
    cacheTtl: CACHE_MEDIUM,
  });
}

export async function getCanonFact(factId: string) {
  return api.get<CanonFact>(`/api/v1/narrative/canon/facts/${factId}`, {
    cacheTtl: CACHE_SHORT,
  });
}

export async function narrativePreview(text: string, context?: string) {
  return api.post<PreviewResult>("/api/v1/narrative/preview", { text, context });
}

// ---------------------------------------------------------------------------
// Persona
// ---------------------------------------------------------------------------

export async function getPersonaMetrics() {
  return api.get<PersonaProfile>("/api/v1/persona/", { cacheTtl: CACHE_SHORT });
}

export async function recordPersonaSample(text: string) {
  return api.post("/api/v1/persona/record", { text });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(email: string, password: string) {
  return api.post<{ access_token?: string; token?: string }>("/api/v1/auth/login", {
    email,
    password,
  });
}

export async function register(email: string, password: string, displayName?: string) {
  return api.post<{ access_token?: string; token?: string }>("/api/v1/auth/register", {
    email,
    password,
    display_name: displayName ?? null,
  });
}

export async function getMe(): Promise<UserInfo | null> {
  try {
    return await api.get<UserInfo>("/api/v1/auth/me", { retries: 0 });
  } catch {
    return null;
  }
}
