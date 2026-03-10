import { create } from "zustand";
import type {
  NarrativeEntity,
  Relationship,
  PlotThread,
  OracleSignal,
  Echo,
  PressureZone,
  SimulationScenario,
} from "@/lib/demo-data";
import {
  DEMO_UNIVERSE,
  DEMO_ENTITIES,
  DEMO_RELATIONSHIPS,
  DEMO_THREADS,
  DEMO_ORACLE,
  DEMO_ECHOES,
  DEMO_PRESSURE_ZONES,
  DEMO_SIMULATIONS,
} from "@/lib/demo-data";
import {
  getNarrativeObjects,
  getNarrativeEdges,
  getNarrativePlotThreads,
  getNarrativeTimeline,
  getNarrativeCharacters,
} from "@/lib/api";
import { nioBus } from "@/lib/event-bus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UniverseHealth = {
  narrativeHealth: number;
  instability: number;
  tensionLoad: number;
  threatOfCollapse: number;
  unresolvedMass: number;
  completionGravity: number;
};

export type ChronosState = {
  presentLine: string[];
  branchPoints: Array<{ id: string; moment: string; branches: string[] }>;
  paradoxes: Array<{ id: string; description: string; severity: number }>;
};

type DataSource = "demo" | "api" | "hybrid";

export type CharacterEntry = { id: string; name: string; summary?: string };

// ---------------------------------------------------------------------------
// State shape — split into system data vs. UI-transient state
// ---------------------------------------------------------------------------

interface NarrativeSystemState {
  source: DataSource;
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;

  universe: typeof DEMO_UNIVERSE;
  health: UniverseHealth;
  entities: NarrativeEntity[];
  relationships: Relationship[];
  threads: PlotThread[];
  oracle: OracleSignal[];
  echoes: Echo[];
  pressureZones: PressureZone[];
  simulations: SimulationScenario[];
  chronos: ChronosState;
  characters: CharacterEntry[];
}

interface NarrativeActions {
  loadFromApi: () => Promise<void>;
  loadDemo: () => void;
  setEntities: (entities: NarrativeEntity[]) => void;
  setThreads: (threads: PlotThread[]) => void;
  updateHealth: (patch: Partial<UniverseHealth>) => void;
}

export type NarrativeState = NarrativeSystemState & NarrativeActions;

// ---------------------------------------------------------------------------
// Demo defaults
// ---------------------------------------------------------------------------

const DEMO_CHRONOS: ChronosState = {
  presentLine: ["Storm Gate", "Retreat", "Ilyra's discovery", "Kassen's hunt", "Confrontation"],
  branchPoints: [
    { id: "bp1", moment: "Storm Gate", branches: ["Marcus survives", "Marcus dies"] },
  ],
  paradoxes: [
    { id: "p1", description: "Marcus whereabouts Act II unclear", severity: 0.7 },
  ],
};

const DEFAULT_HEALTH: UniverseHealth = {
  narrativeHealth: DEMO_UNIVERSE.narrativeHealth,
  instability: DEMO_UNIVERSE.instability,
  tensionLoad: DEMO_UNIVERSE.tensionLoad,
  threatOfCollapse: 0.15,
  unresolvedMass: 0.34,
  completionGravity: 0.62,
};

function demoCharacters(): CharacterEntry[] {
  return DEMO_ENTITIES.filter((e) => e.type === "character").map((e) => ({
    id: e.id,
    name: e.name,
    summary: e.summary,
  }));
}

// ---------------------------------------------------------------------------
// Stale data threshold (refetch if older than 5 min)
// ---------------------------------------------------------------------------

const STALE_THRESHOLD = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNarrativeStore = create<NarrativeState>()((set, get) => ({
  source: "demo",
  loading: false,
  error: null,
  lastLoadedAt: null,
  universe: DEMO_UNIVERSE,
  health: DEFAULT_HEALTH,
  entities: DEMO_ENTITIES,
  relationships: DEMO_RELATIONSHIPS,
  threads: DEMO_THREADS,
  oracle: DEMO_ORACLE,
  echoes: DEMO_ECHOES,
  pressureZones: DEMO_PRESSURE_ZONES,
  simulations: DEMO_SIMULATIONS,
  chronos: DEMO_CHRONOS,
  characters: demoCharacters(),

  loadFromApi: async () => {
    const state = get();
    // Avoid redundant loads if data is fresh
    if (state.loading) return;
    if (
      state.lastLoadedAt &&
      state.source === "api" &&
      Date.now() - state.lastLoadedAt < STALE_THRESHOLD
    ) {
      return;
    }

    set({ loading: true, error: null });
    nioBus.emit("narrative:loading", {});
    try {
      // Parallel fetch — no waterfall
      const [objs, edges, threadsRes, timelineRes, chars] = await Promise.allSettled([
        getNarrativeObjects(),
        getNarrativeEdges(),
        getNarrativePlotThreads(),
        getNarrativeTimeline(),
        getNarrativeCharacters(),
      ]);

      const apiObjs =
        objs.status === "fulfilled" && Array.isArray(objs.value) ? objs.value : [];
      const apiEdges =
        edges.status === "fulfilled" && Array.isArray(edges.value) ? edges.value : [];
      const apiThreads =
        threadsRes.status === "fulfilled" && threadsRes.value?.threads
          ? threadsRes.value.threads
          : [];
      const apiTimeline =
        timelineRes.status === "fulfilled" && timelineRes.value?.events
          ? timelineRes.value.events
          : [];
      const apiChars =
        chars.status === "fulfilled" && Array.isArray(chars.value) ? chars.value : [];

      const hasApiData = apiObjs.length > 0 || apiChars.length > 0;

      const entities: NarrativeEntity[] = hasApiData
        ? apiObjs.map(
            (o: { id: string; name: string; object_type: string; summary?: string }) => ({
              id: o.id,
              name: o.name,
              type: o.object_type as NarrativeEntity["type"],
              summary: o.summary,
            })
          )
        : DEMO_ENTITIES;

      const relationships: Relationship[] =
        apiEdges.length > 0
          ? apiEdges.map(
              (e: { source_id: string; target_id: string; edge_type: string }) => ({
                source: e.source_id,
                target: e.target_id,
                edge: e.edge_type as Relationship["edge"],
              })
            )
          : DEMO_RELATIONSHIPS;

      const threads: PlotThread[] =
        apiThreads.length > 0
          ? apiThreads.map(
              (t: {
                id: string;
                name: string;
                status: string;
                related_events?: string[];
              }) => ({
                id: t.id,
                name: t.name,
                status: (t.status || "dormant") as PlotThread["status"],
                heat: 0.5,
                participants: t.related_events || [],
              })
            )
          : DEMO_THREADS;

      const characters: CharacterEntry[] =
        apiChars.length > 0
          ? apiChars.map((c: { id: string; name: string; summary?: string }) => ({
              id: c.id,
              name: c.name,
              summary: c.summary,
            }))
          : demoCharacters();

      const finalSource = hasApiData ? "api" : "demo";
      set({
        source: finalSource,
        loading: false,
        lastLoadedAt: Date.now(),
        entities,
        relationships,
        threads,
        characters,
        chronos:
          apiTimeline.length > 0
            ? {
                ...DEMO_CHRONOS,
                presentLine: apiTimeline.map((ev: { name: string }) => ev.name),
              }
            : DEMO_CHRONOS,
      });
      nioBus.emit("narrative:loaded", {
        source: finalSource,
        entityCount: entities.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load narrative data";
      set({
        loading: false,
        error: message,
        source: "demo",
      });
      nioBus.emit("narrative:error", { message });
    }
  },

  loadDemo: () => {
    set({
      source: "demo",
      loading: false,
      error: null,
      lastLoadedAt: Date.now(),
      entities: DEMO_ENTITIES,
      relationships: DEMO_RELATIONSHIPS,
      threads: DEMO_THREADS,
      oracle: DEMO_ORACLE,
      echoes: DEMO_ECHOES,
      pressureZones: DEMO_PRESSURE_ZONES,
      simulations: DEMO_SIMULATIONS,
      chronos: DEMO_CHRONOS,
      characters: demoCharacters(),
      health: DEFAULT_HEALTH,
    });
    nioBus.emit("narrative:loaded", {
      source: "demo",
      entityCount: DEMO_ENTITIES.length,
    });
  },

  setEntities: (entities) => set({ entities }),
  setThreads: (threads) => set({ threads }),
  updateHealth: (patch) => {
    set((s) => ({ health: { ...s.health, ...patch } }));
    for (const [field, value] of Object.entries(patch)) {
      if (typeof value === "number") {
        nioBus.emit("narrative:health:updated", { field, value });
      }
    }
  },
}));

// ---------------------------------------------------------------------------
// Selectors — granular subscriptions to prevent unnecessary re-renders
// ---------------------------------------------------------------------------

export const selectSource = (s: NarrativeState) => s.source;
export const selectLoading = (s: NarrativeState) => s.loading;
export const selectError = (s: NarrativeState) => s.error;
export const selectUniverse = (s: NarrativeState) => s.universe;
export const selectHealth = (s: NarrativeState) => s.health;
export const selectEntities = (s: NarrativeState) => s.entities;
export const selectRelationships = (s: NarrativeState) => s.relationships;
export const selectThreads = (s: NarrativeState) => s.threads;
export const selectOracle = (s: NarrativeState) => s.oracle;
export const selectEchoes = (s: NarrativeState) => s.echoes;
export const selectPressureZones = (s: NarrativeState) => s.pressureZones;
export const selectSimulations = (s: NarrativeState) => s.simulations;
export const selectChronos = (s: NarrativeState) => s.chronos;
export const selectCharacters = (s: NarrativeState) => s.characters;

// Derived selectors
export const selectCharacterCount = (s: NarrativeState) => s.characters.length;
export const selectEntityCount = (s: NarrativeState) => s.entities.length;
export const selectActiveThreads = (s: NarrativeState) =>
  s.threads.filter((t) => t.status === "rising" || t.status === "knot");
export const selectCriticalOracle = (s: NarrativeState) =>
  s.oracle.filter((o) => o.severity === "critical" || o.severity === "high");

// ---------------------------------------------------------------------------
// Event bus: reset to demo on logout (replaces require() bridge)
// ---------------------------------------------------------------------------

nioBus.on("auth:logout", () => {
  useNarrativeStore.getState().loadDemo();
});
