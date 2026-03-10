const TOKEN_KEY = "weriterbrainn_token";
const TOKEN_TS_KEY = "weriterbrainn_token_ts";

/** Maximum age before we consider the token stale and re-verify (24h) */
const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Token CRUD
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_TS_KEY, String(Date.now()));
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_TS_KEY);
}

// ---------------------------------------------------------------------------
// Token freshness
// ---------------------------------------------------------------------------

export function getTokenAge(): number | null {
  if (typeof window === "undefined") return null;
  const ts = localStorage.getItem(TOKEN_TS_KEY);
  if (!ts) return null;
  return Date.now() - Number(ts);
}

export function isTokenStale(): boolean {
  const age = getTokenAge();
  if (age === null) return true;
  return age > TOKEN_MAX_AGE;
}

// ---------------------------------------------------------------------------
// Header helpers
// ---------------------------------------------------------------------------

export function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function withAuth<T extends Record<string, string>>(
  headers: T
): T & Record<string, string> {
  return { ...headers, ...authHeaders() } as T & Record<string, string>;
}
