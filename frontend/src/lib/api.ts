const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export async function chatJson(
  message: string,
  conversationId?: string
): Promise<{ response: string; conversation_id: string }> {
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

export async function searchMemories(q: string, limit = 10) {
  const res = await fetch(
    `${API_BASE}/api/v1/memories/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { headers: apiHeaders() }
  );
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
