/**
 * NIO-OS Event Bus
 *
 * Typed pub/sub system for decoupled cross-system communication.
 * Supports namespaced events, wildcard subscriptions, one-shot
 * listeners, and an event history buffer for late subscribers.
 */

// ---------------------------------------------------------------------------
// Event Map — all events the system can emit
// ---------------------------------------------------------------------------

export interface NIOEventMap {
  // Auth lifecycle
  "auth:hydrated": { userId: string | null; status: string };
  "auth:login": { userId: string; email: string };
  "auth:logout": {};
  "auth:error": { message: string };

  // Narrative data lifecycle
  "narrative:loading": {};
  "narrative:loaded": { source: "api" | "demo" | "hybrid"; entityCount: number };
  "narrative:error": { message: string };
  "narrative:health:updated": { field: string; value: number };

  // Entity mutations
  "entity:created": { id: string; type: string; name: string };
  "entity:updated": { id: string; changes: Record<string, unknown> };
  "entity:deleted": { id: string };

  // Thread mutations
  "thread:updated": { id: string; status: string; heat: number };
  "thread:created": { id: string; name: string };

  // API lifecycle
  "api:request": { method: string; path: string; timestamp: number };
  "api:response": { method: string; path: string; status: number; duration: number };
  "api:error": { method: string; path: string; status: number; message: string };
  "api:cache:hit": { path: string };

  // Navigation
  "dimension:navigated": { from: string; to: string };

  // Simulation
  "simulation:started": { operationId: string };
  "simulation:completed": { operationId: string; risk: number };

  // Plugin lifecycle
  "plugin:registered": { id: string; name: string };
  "plugin:activated": { id: string };
  "plugin:deactivated": { id: string };
  "plugin:error": { id: string; message: string };

  // Dimension registry
  "dimension:registered": { id: string; label: string; href: string };
  "dimension:unregistered": { id: string };

  // System diagnostics
  "system:ready": {};
  "system:error": { message: string; source: string };
}

// Wildcard support: "auth:*" matches all auth events
type WildcardPattern = `${string}:*`;
type EventName = keyof NIOEventMap;
type SubscribableEvent = EventName | WildcardPattern;

// ---------------------------------------------------------------------------
// Listener types
// ---------------------------------------------------------------------------

type Listener<T = unknown> = (payload: T) => void;

interface ListenerEntry {
  fn: Listener;
  once: boolean;
}

interface EmittedEvent {
  event: EventName;
  payload: unknown;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Event Bus
// ---------------------------------------------------------------------------

const HISTORY_LIMIT = 100;

class EventBus {
  private listeners = new Map<string, ListenerEntry[]>();
  private history: EmittedEvent[] = [];
  private _paused = false;

  /**
   * Subscribe to a specific event or wildcard pattern.
   * Returns an unsubscribe function.
   */
  on<E extends EventName>(event: E, fn: Listener<NIOEventMap[E]>): () => void;
  on(pattern: WildcardPattern, fn: Listener<unknown>): () => void;
  on(event: string, fn: Listener<unknown>): () => void {
    return this.addListener(event, fn, false);
  }

  /**
   * Subscribe to a single occurrence of an event.
   */
  once<E extends EventName>(event: E, fn: Listener<NIOEventMap[E]>): () => void;
  once(pattern: WildcardPattern, fn: Listener<unknown>): () => void;
  once(event: string, fn: Listener<unknown>): () => void {
    return this.addListener(event, fn, true);
  }

  /**
   * Remove a specific listener.
   */
  off(event: string, fn: Listener<unknown>): void {
    const entries = this.listeners.get(event);
    if (!entries) return;
    this.listeners.set(
      event,
      entries.filter((e) => e.fn !== fn)
    );
  }

  /**
   * Emit an event to all matching listeners.
   */
  emit<E extends EventName>(event: E, payload: NIOEventMap[E]): void {
    const entry: EmittedEvent = { event, payload, timestamp: Date.now() };
    this.history.push(entry);
    if (this.history.length > HISTORY_LIMIT) {
      this.history = this.history.slice(-HISTORY_LIMIT);
    }

    if (this._paused) return;

    // Direct listeners
    this.dispatch(event, payload);

    // Wildcard listeners: "auth:login" matches "auth:*"
    const ns = event.split(":")[0];
    if (ns) {
      this.dispatch(`${ns}:*`, payload);
    }
  }

  /**
   * Get recent event history, optionally filtered by pattern.
   */
  getHistory(filter?: string): EmittedEvent[] {
    if (!filter) return [...this.history];
    if (filter.endsWith(":*")) {
      const prefix = filter.slice(0, -2);
      return this.history.filter((e) => e.event.startsWith(prefix + ":"));
    }
    return this.history.filter((e) => e.event === filter);
  }

  /**
   * Clear event history.
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Pause event delivery (events still recorded in history).
   */
  pause(): void {
    this._paused = true;
  }

  /**
   * Resume event delivery.
   */
  resume(): void {
    this._paused = false;
  }

  get paused(): boolean {
    return this._paused;
  }

  /**
   * Count listeners for a given event.
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * Remove all listeners, optionally for a specific event.
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  // ---- Internal -----------------------------------------------------------

  private addListener(event: string, fn: Listener<unknown>, once: boolean): () => void {
    const entries = this.listeners.get(event) ?? [];
    const entry: ListenerEntry = { fn, once };
    entries.push(entry);
    this.listeners.set(event, entries);

    return () => this.off(event, fn);
  }

  private dispatch(key: string, payload: unknown): void {
    const entries = this.listeners.get(key);
    if (!entries || entries.length === 0) return;

    const toRemove: ListenerEntry[] = [];
    for (const entry of entries) {
      try {
        entry.fn(payload);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(`[NIOEventBus] Listener error on "${key}":`, err);
        }
      }
      if (entry.once) toRemove.push(entry);
    }

    if (toRemove.length > 0) {
      this.listeners.set(
        key,
        entries.filter((e) => !toRemove.includes(e))
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const nioBus = new EventBus();

// Re-export types for consumers
export type { EventName, SubscribableEvent, EmittedEvent };
