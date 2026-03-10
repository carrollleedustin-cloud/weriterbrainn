/**
 * NIO-OS Dimension Registry
 *
 * Dynamic dimension registration system. Replaces hardcoded route
 * arrays in DimensionNav, LayoutSwitcher, and keyboard shortcuts.
 *
 * Dimensions register themselves and the UI reads from this registry
 * instead of maintaining scattered constant arrays.
 */

import { nioBus } from "./event-bus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DimensionDef {
  /** Unique dimension identifier, e.g. "nexus", "simulation" */
  id: string;
  /** URL path, e.g. "/nexus" */
  href: string;
  /** Display label, e.g. "Nexus" */
  label: string;
  /** Optional glyph/icon */
  glyph?: string;
  /** Description for tooltips / accessibility */
  description?: string;
  /** Whether to show in the top nav bar (header) */
  showInNav?: boolean;
  /** Whether to show in the dimension strip (DimensionNav) */
  showInDimensionNav?: boolean;
  /** Keyboard shortcut index (1-9 for Ctrl+1..9). 0 = no shortcut. */
  shortcutIndex?: number;
  /** Sort order (lower = earlier). Default 100. */
  order?: number;
  /** Plugin ID that owns this dimension */
  pluginId?: string;
}

type DimensionChangeListener = (dimensions: DimensionDef[]) => void;

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

class DimensionRegistry {
  private dimensions = new Map<string, DimensionDef>();
  private changeListeners = new Set<DimensionChangeListener>();

  /**
   * Register a dimension. Overwrites if already exists.
   */
  register(def: DimensionDef): void {
    this.dimensions.set(def.id, {
      showInNav: true,
      showInDimensionNav: true,
      shortcutIndex: 0,
      order: 100,
      ...def,
    });

    nioBus.emit("dimension:registered", {
      id: def.id,
      label: def.label,
      href: def.href,
    });

    this.notifyChange();
  }

  /**
   * Register multiple dimensions at once.
   */
  registerAll(defs: DimensionDef[]): void {
    for (const def of defs) {
      this.dimensions.set(def.id, {
        showInNav: true,
        showInDimensionNav: true,
        shortcutIndex: 0,
        order: 100,
        ...def,
      });
    }
    this.notifyChange();
  }

  /**
   * Unregister a dimension by ID.
   */
  unregister(id: string): void {
    if (this.dimensions.delete(id)) {
      nioBus.emit("dimension:unregistered", { id });
      this.notifyChange();
    }
  }

  /**
   * Get all dimensions, sorted by order.
   */
  getAll(): DimensionDef[] {
    return [...this.dimensions.values()].sort(
      (a, b) => (a.order ?? 100) - (b.order ?? 100)
    );
  }

  /**
   * Get dimensions visible in the header nav bar.
   */
  getNavDimensions(): DimensionDef[] {
    return this.getAll().filter((d) => d.showInNav);
  }

  /**
   * Get dimensions visible in the dimension strip.
   */
  getDimensionNavItems(): DimensionDef[] {
    return this.getAll().filter((d) => d.showInDimensionNav);
  }

  /**
   * Get the shortcut map: index (1-9) → href.
   */
  getShortcutMap(): Record<number, string> {
    const map: Record<number, string> = {};
    for (const d of this.dimensions.values()) {
      if (d.shortcutIndex && d.shortcutIndex >= 1 && d.shortcutIndex <= 9) {
        map[d.shortcutIndex] = d.href;
      }
    }
    return map;
  }

  /**
   * Get a specific dimension by ID.
   */
  get(id: string): DimensionDef | undefined {
    return this.dimensions.get(id);
  }

  /**
   * Check if a dimension is registered.
   */
  has(id: string): boolean {
    return this.dimensions.has(id);
  }

  /**
   * Subscribe to dimension changes. Returns unsubscribe function.
   */
  onChange(listener: DimensionChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  // ---- Internal -----------------------------------------------------------

  private notifyChange(): void {
    const all = this.getAll();
    for (const listener of this.changeListeners) {
      try {
        listener(all);
      } catch {
        // Swallow listener errors
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton + default dimensions
// ---------------------------------------------------------------------------

export const dimensionRegistry = new DimensionRegistry();

// Register the built-in NIO-OS dimensions
dimensionRegistry.registerAll([
  { id: "nexus",        href: "/nexus",        label: "Nexus",       glyph: "◎", order: 10,  shortcutIndex: 1, description: "Origin Nexus — universe command center" },
  { id: "cosmos",       href: "/universe",     label: "Cosmos",      glyph: "✦", order: 20,  shortcutIndex: 2, description: "Story Cosmos — knowledge graph & extraction" },
  { id: "river",        href: "/river",        label: "River",       glyph: "≈", order: 30,  shortcutIndex: 3, description: "Temporal River — timeline & causality" },
  { id: "loom",         href: "/loom",         label: "Loom",        glyph: "⊶", order: 40,  shortcutIndex: 4, description: "Loom of Fate — plot threads & tension" },
  { id: "cast",         href: "/cast",         label: "Cast",        glyph: "☽", order: 50,  shortcutIndex: 5, description: "Character Forge — mindspace & psychology" },
  { id: "forge",        href: "/writing",      label: "Forge",       glyph: "△", order: 60,  shortcutIndex: 6, description: "Writing Forge — narrative lens & composition" },
  { id: "oracle",       href: "/chat",         label: "Oracle",      glyph: "◇", order: 70,  shortcutIndex: 7, description: "Oracle — AI narrative advisor" },
  { id: "simulation",   href: "/simulation",   label: "Simulation",  glyph: "⟐", order: 80,  shortcutIndex: 8, description: "Simulation Chamber — what-if operations" },
  { id: "echo-vault",   href: "/echo-vault",   label: "Echo Vault",  glyph: "◈", order: 90,  shortcutIndex: 9, description: "Echo Vault — narrative resonance patterns" },
  { id: "pressure-map", href: "/pressure-map", label: "Pressure",    glyph: "⊞", order: 100, description: "Pressure Map — structural intensity zones" },
  { id: "dreamscape",   href: "/dreamscape",   label: "Dreamscape",  glyph: "✧", order: 110, description: "Dreamscape — dream logic & archetypes" },
  { id: "ascend",       href: "/ascend",       label: "Ascend",      glyph: "⫿", order: 200, showInDimensionNav: false, description: "Subscription tiers" },
]);
