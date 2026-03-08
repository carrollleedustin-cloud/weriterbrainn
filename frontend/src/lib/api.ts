/** Same-origin when unset (Netlify /api/*); override for local dev or custom API. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("weriterbrainn_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function chat(
  message: string,
  conversationId?: string,
  stream = false
): Promise<Response> {
  const res = await fetch(`${API_BASE}/api/v1/chat/`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({
      message,
      conversation_id: conversationId || null,
      stream,
    }),
  });
  return res;
}

export type Citation = { index: number; memory_id: string; chunk_text: string };

export async function chatJson(
  message: string,
  conversationId?: string
): Promise<{ response: string; conversation_id: string; citations: Citation[] }> {
  const res = await chat(message, conversationId, false);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function recordAnalytics(
  eventType: "response_accepted" | "response_regenerated" | "response_edited",
  payload?: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE}/api/v1/analytics/events`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ event_type: eventType, payload }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function searchMemories(
  q: string,
  limit = 10,
  filters?: { memory_type?: string; tier?: string }
) {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (filters?.memory_type) params.set("memory_type", filters.memory_type);
  if (filters?.tier) params.set("tier", filters.tier);
  const res = await fetch(
    `${API_BASE}/api/v1/memories/search?${params}`,
    { headers: apiHeaders() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function consolidateMemories(options?: {
  older_than_days?: number;
  batch_limit?: number;
}) {
  const res = await fetch(`${API_BASE}/api/v1/memories/consolidate`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(options ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createMemory(content: string, type = "note", title?: string) {
  const res = await fetch(`${API_BASE}/api/v1/memories/`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ content, memory_type: type, title }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function searchGraphEntities(q: string, limit = 10) {
  const res = await fetch(
    `${API_BASE}/api/v1/graph/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { headers: apiHeaders() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getGraphNodes() {
  const res = await fetch(`${API_BASE}/api/v1/graph/nodes`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getGraphEdges() {
  const res = await fetch(`${API_BASE}/api/v1/graph/edges`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function narrativeExtract(text: string) {
  const res = await fetch(`${API_BASE}/api/v1/narrative/extract`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNarrativeProject() {
  const res = await fetch(`${API_BASE}/api/v1/narrative/project`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNarrativeObjects(type?: string) {
  const params = type ? `?type=${encodeURIComponent(type)}` : "";
  const res = await fetch(`${API_BASE}/api/v1/narrative/objects${params}`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNarrativeEdges() {
  const res = await fetch(`${API_BASE}/api/v1/narrative/edges`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function narrativeCompile(text: string) {
  const res = await fetch(`${API_BASE}/api/v1/narrative/compile`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNarrativeTimeline() {
  const res = await fetch(`${API_BASE}/api/v1/narrative/timeline`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNarrativePlotThreads() {
  const res = await fetch(`${API_BASE}/api/v1/narrative/plot-threads`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNarrativeStrategy(focus?: string) {
  const params = focus ? `?focus=${encodeURIComponent(focus)}` : "";
  const res = await fetch(`${API_BASE}/api/v1/narrative/strategy${params}`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function narrativeAsk(q: string) {
  const res = await fetch(
    `${API_BASE}/api/v1/narrative/ask?q=${encodeURIComponent(q)}`,
    { headers: apiHeaders() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNarrativeCharacters() {
  const res = await fetch(`${API_BASE}/api/v1/narrative/characters`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCharacterDetails(objectId: string) {
  const res = await fetch(`${API_BASE}/api/v1/narrative/characters/${objectId}`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function narrativePreview(text: string, context?: string) {
  const res = await fetch(`${API_BASE}/api/v1/narrative/preview`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ text, context }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function extractFromText(text: string) {
  const res = await fetch(`${API_BASE}/api/v1/graph/extract`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPersonaMetrics() {
  const res = await fetch(`${API_BASE}/api/v1/persona/`, {
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type EventCount = { date: string; event_type: string; count: string };

export async function getAnalyticsInsights(days = 14): Promise<{ event_counts: EventCount[] }> {
  const res = await fetch(
    `${API_BASE}/api/v1/analytics/insights?days=${days}`,
    { headers: apiHeaders() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function recordPersonaSample(text: string) {
  const res = await fetch(`${API_BASE}/api/v1/persona/record`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === "string" ? data.detail : "Login failed");
  }
  return res.json();
}

export async function register(email: string, password: string, displayName?: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ email, password, display_name: displayName ?? null }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === "string" ? data.detail : "Registration failed");
  }
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: apiHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
}
