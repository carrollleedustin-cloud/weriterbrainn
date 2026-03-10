/**
 * NIO-OS Plugin Registry
 *
 * Module registration system with lifecycle hooks, dependency
 * resolution, and event-bus integration. Allows subsystems to
 * self-register and be discovered at runtime.
 */

import { nioBus } from "./event-bus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PluginStatus = "registered" | "activating" | "active" | "deactivating" | "inactive" | "error";

export interface PluginManifest {
  /** Unique identifier, e.g. "dimension:simulation" */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semantic version */
  version: string;
  /** Optional description */
  description?: string;
  /** Plugin IDs this plugin depends on */
  dependencies?: string[];
  /** Priority for activation order (higher = earlier). Default 0. */
  priority?: number;
}

export interface PluginHooks {
  /** Called when the plugin is activated. Can be async. */
  onActivate?: () => void | Promise<void>;
  /** Called when the plugin is deactivated. */
  onDeactivate?: () => void | Promise<void>;
  /** Called when a dependency becomes available */
  onDependencyReady?: (depId: string) => void;
  /** Called on system shutdown */
  onDestroy?: () => void;
}

export interface NIOPlugin {
  manifest: PluginManifest;
  hooks?: PluginHooks;
  /** Arbitrary exports the plugin makes available to others */
  exports?: Record<string, unknown>;
}

interface PluginEntry {
  plugin: NIOPlugin;
  status: PluginStatus;
  activatedAt: number | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

class PluginRegistry {
  private plugins = new Map<string, PluginEntry>();

  /**
   * Register a plugin. Does not activate it.
   */
  register(plugin: NIOPlugin): void {
    const { id, name } = plugin.manifest;

    if (this.plugins.has(id)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[PluginRegistry] Plugin "${id}" already registered, skipping.`);
      }
      return;
    }

    this.plugins.set(id, {
      plugin,
      status: "registered",
      activatedAt: null,
      error: null,
    });

    nioBus.emit("plugin:registered", { id, name });
  }

  /**
   * Activate a plugin. Resolves dependencies first.
   */
  async activate(id: string): Promise<void> {
    const entry = this.plugins.get(id);
    if (!entry) {
      throw new Error(`Plugin "${id}" not found`);
    }

    if (entry.status === "active" || entry.status === "activating") return;

    // Check dependencies
    const deps = entry.plugin.manifest.dependencies ?? [];
    for (const depId of deps) {
      const dep = this.plugins.get(depId);
      if (!dep) {
        entry.status = "error";
        entry.error = `Missing dependency: ${depId}`;
        nioBus.emit("plugin:error", { id, message: entry.error });
        throw new Error(entry.error);
      }
      if (dep.status !== "active") {
        await this.activate(depId);
      }
    }

    entry.status = "activating";
    try {
      await entry.plugin.hooks?.onActivate?.();
      entry.status = "active";
      entry.activatedAt = Date.now();
      entry.error = null;
      nioBus.emit("plugin:activated", { id });

      // Notify dependents
      for (const [, other] of this.plugins) {
        if (other.plugin.manifest.dependencies?.includes(id)) {
          other.plugin.hooks?.onDependencyReady?.(id);
        }
      }
    } catch (err) {
      entry.status = "error";
      entry.error = err instanceof Error ? err.message : "Activation failed";
      nioBus.emit("plugin:error", { id, message: entry.error });
      throw err;
    }
  }

  /**
   * Deactivate a plugin.
   */
  async deactivate(id: string): Promise<void> {
    const entry = this.plugins.get(id);
    if (!entry || entry.status !== "active") return;

    entry.status = "deactivating";
    try {
      await entry.plugin.hooks?.onDeactivate?.();
      entry.status = "inactive";
      nioBus.emit("plugin:deactivated", { id });
    } catch (err) {
      entry.status = "error";
      entry.error = err instanceof Error ? err.message : "Deactivation failed";
      nioBus.emit("plugin:error", { id, message: entry.error });
    }
  }

  /**
   * Activate all registered plugins in priority order.
   */
  async activateAll(): Promise<void> {
    const sorted = [...this.plugins.entries()]
      .filter(([, e]) => e.status === "registered" || e.status === "inactive")
      .sort(([, a], [, b]) => {
        const pa = a.plugin.manifest.priority ?? 0;
        const pb = b.plugin.manifest.priority ?? 0;
        return pb - pa;
      });

    for (const [id] of sorted) {
      try {
        await this.activate(id);
      } catch {
        // Errors already emitted via event bus
      }
    }
  }

  /**
   * Get a plugin's public exports.
   */
  getExports<T = Record<string, unknown>>(id: string): T | null {
    const entry = this.plugins.get(id);
    if (!entry || entry.status !== "active") return null;
    return (entry.plugin.exports ?? {}) as T;
  }

  /**
   * Check if a plugin is active.
   */
  isActive(id: string): boolean {
    return this.plugins.get(id)?.status === "active";
  }

  /**
   * Get plugin status.
   */
  getStatus(id: string): PluginStatus | null {
    return this.plugins.get(id)?.status ?? null;
  }

  /**
   * Get all registered plugins with their status.
   */
  list(): Array<{ id: string; name: string; version: string; status: PluginStatus; error: string | null }> {
    return [...this.plugins.entries()].map(([id, entry]) => ({
      id,
      name: entry.plugin.manifest.name,
      version: entry.plugin.manifest.version,
      status: entry.status,
      error: entry.error,
    }));
  }

  /**
   * Destroy all plugins and clear the registry.
   */
  async destroy(): Promise<void> {
    const activeIds = [...this.plugins.entries()]
      .filter(([, e]) => e.status === "active")
      .map(([id]) => id);

    for (const id of activeIds) {
      await this.deactivate(id);
    }

    for (const [, entry] of this.plugins) {
      entry.plugin.hooks?.onDestroy?.();
    }

    this.plugins.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const plugins = new PluginRegistry();
