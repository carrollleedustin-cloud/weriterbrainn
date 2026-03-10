import { getToken, clearToken } from "./auth";
import { ApiError, isApiError } from "./errors";
import { nioBus } from "./event-bus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestConfig {
  method?: RequestMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip deduplication even for GET requests */
  skipDedup?: boolean;
  /** Number of retry attempts (default: 2 for GET, 0 for mutations) */
  retries?: number;
  /** Cache TTL in ms for GET requests (0 = no cache) */
  cacheTtl?: number;
  /** Return raw Response instead of parsed JSON */
  raw?: boolean;
}

type Interceptor<T> = (value: T) => T | Promise<T>;

interface PendingRequest {
  promise: Promise<unknown>;
  controller: AbortController;
  timestamp: number;
}

interface CacheEntry {
  data: unknown;
  expires: number;
}

// ---------------------------------------------------------------------------
// ApiClient
// ---------------------------------------------------------------------------

const DEFAULT_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const RETRY_BASE_DELAY = 300;
const MAX_RETRY_DELAY = 5000;

export class ApiClient {
  private base: string;
  private inflightGets = new Map<string, PendingRequest>();
  private cache = new Map<string, CacheEntry>();

  private requestInterceptors: Interceptor<RequestInit>[] = [];
  private responseInterceptors: Interceptor<Response>[] = [];
  private errorInterceptors: Array<(err: ApiError) => void> = [];

  constructor(base = DEFAULT_BASE) {
    this.base = base;
  }

  // ---- Interceptors -------------------------------------------------------

  onRequest(fn: Interceptor<RequestInit>) {
    this.requestInterceptors.push(fn);
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter((i) => i !== fn);
    };
  }

  onResponse(fn: Interceptor<Response>) {
    this.responseInterceptors.push(fn);
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter((i) => i !== fn);
    };
  }

  onError(fn: (err: ApiError) => void) {
    this.errorInterceptors.push(fn);
    return () => {
      this.errorInterceptors = this.errorInterceptors.filter((i) => i !== fn);
    };
  }

  // ---- Cache management ---------------------------------------------------

  invalidate(pattern?: string | RegExp) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      const matches =
        typeof pattern === "string" ? key.includes(pattern) : pattern.test(key);
      if (matches) this.cache.delete(key);
    }
  }

  // ---- Core fetch ---------------------------------------------------------

  async request<T = unknown>(path: string, config: RequestConfig = {}): Promise<T> {
    const method = config.method ?? "GET";
    const isGet = method === "GET";
    const retries = config.retries ?? (isGet ? 2 : 0);
    const cacheTtl = config.cacheTtl ?? 0;

    const url = this.buildUrl(path, config.params);
    const cacheKey = `${method}:${url}`;

    // Check cache
    if (isGet && cacheTtl > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        nioBus.emit("api:cache:hit", { path });
        return cached.data as T;
      }
      this.cache.delete(cacheKey);
    }

    // Deduplicate identical in-flight GET requests
    if (isGet && !config.skipDedup) {
      const existing = this.inflightGets.get(cacheKey);
      if (existing) return existing.promise as Promise<T>;
    }

    const controller = new AbortController();
    if (config.signal) {
      config.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    const execute = async (): Promise<T> => {
      let lastError: ApiError | null = null;
      const requestStart = Date.now();
      nioBus.emit("api:request", { method, path, timestamp: requestStart });

      for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
          const delay = Math.min(
            RETRY_BASE_DELAY * Math.pow(2, attempt - 1),
            MAX_RETRY_DELAY
          );
          await new Promise((r) => setTimeout(r, delay));
        }

        try {
          let init: RequestInit = {
            method,
            headers: this.buildHeaders(config.headers),
            signal: controller.signal,
          };

          if (config.body !== undefined && !isGet) {
            init.body = JSON.stringify(config.body);
          }

          for (const interceptor of this.requestInterceptors) {
            init = await interceptor(init);
          }

          let res = await fetch(url, init);

          for (const interceptor of this.responseInterceptors) {
            res = await interceptor(res);
          }

          if (!res.ok) {
            const body = await res.text();
            throw new ApiError(res.status, body);
          }

          if (config.raw) {
            nioBus.emit("api:response", { method, path, status: res.status, duration: Date.now() - requestStart });
            return res as unknown as T;
          }

          const contentType = res.headers.get("content-type") ?? "";
          const data: T = contentType.includes("application/json")
            ? await res.json()
            : ((await res.text()) as unknown as T);

          // Populate cache
          if (isGet && cacheTtl > 0) {
            this.cache.set(cacheKey, { data, expires: Date.now() + cacheTtl });
          }

          nioBus.emit("api:response", { method, path, status: res.status, duration: Date.now() - requestStart });
          return data;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") throw err;

          if (isApiError(err)) {
            lastError = err;
            for (const handler of this.errorInterceptors) handler(err);
            nioBus.emit("api:error", { method, path, status: err.status, message: err.detail });

            if (err.status < 500 && err.status !== 429) throw err;
          } else {
            lastError = new ApiError(0, err instanceof Error ? err.message : "Network error");
            nioBus.emit("api:error", { method, path, status: 0, message: lastError.detail });
          }

          if (attempt === retries) throw lastError;
        }
      }

      throw lastError ?? new ApiError(0, "Request failed");
    };

    const promise = execute().finally(() => {
      this.inflightGets.delete(cacheKey);
    });

    if (isGet && !config.skipDedup) {
      this.inflightGets.set(cacheKey, { promise, controller, timestamp: Date.now() });
    }

    return promise;
  }

  // ---- Convenience methods ------------------------------------------------

  get<T = unknown>(path: string, config?: Omit<RequestConfig, "method" | "body">) {
    return this.request<T>(path, { ...config, method: "GET" });
  }

  post<T = unknown>(path: string, body?: unknown, config?: Omit<RequestConfig, "method" | "body">) {
    return this.request<T>(path, { ...config, method: "POST", body });
  }

  put<T = unknown>(path: string, body?: unknown, config?: Omit<RequestConfig, "method" | "body">) {
    return this.request<T>(path, { ...config, method: "PUT", body });
  }

  patch<T = unknown>(path: string, body?: unknown, config?: Omit<RequestConfig, "method" | "body">) {
    return this.request<T>(path, { ...config, method: "PATCH", body });
  }

  delete<T = unknown>(path: string, config?: Omit<RequestConfig, "method">) {
    return this.request<T>(path, { ...config, method: "DELETE" });
  }

  // ---- Internal -----------------------------------------------------------

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = `${this.base}${path}`;
    if (!params) return url;
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) search.set(k, String(v));
    }
    const qs = search.toString();
    return qs ? `${url}?${qs}` : url;
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (extra) Object.assign(headers, extra);
    return headers;
  }
}

// ---------------------------------------------------------------------------
// Singleton with global interceptors
// ---------------------------------------------------------------------------

export const api = new ApiClient();

api.onError((err) => {
  if (err.isUnauthorized) {
    clearToken();
    nioBus.emit("auth:logout", {});
  }
});
