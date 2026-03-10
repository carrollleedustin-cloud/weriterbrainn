"use client";

import { useEffect, useRef } from "react";
import { useNarrativeStore } from "@/store/narrative";
import { useAuthStore } from "@/store/auth";

/**
 * Hydrates narrative data on auth change (API when authenticated, demo otherwise).
 * Call this once in a layout or provider — it only triggers the load, not re-renders.
 */
export function useNarrativeInit() {
  const authStatus = useAuthStore((s) => s.status);
  const loadFromApi = useNarrativeStore((s) => s.loadFromApi);
  const loadDemo = useNarrativeStore((s) => s.loadDemo);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    if (authStatus === "idle" || authStatus === "loading") return;

    loaded.current = true;
    if (authStatus === "authenticated") {
      loadFromApi();
    } else {
      loadDemo();
    }
  }, [authStatus, loadFromApi, loadDemo]);
}

/**
 * Convenience hook returning full narrative state + hydration.
 *
 * PERFORMANCE: For pages that only need a slice of narrative data,
 * prefer `useNarrativeStore(selectX)` with granular selectors.
 * This hook subscribes to every field — use sparingly.
 */
export function useNarrative() {
  useNarrativeInit();

  const source = useNarrativeStore((s) => s.source);
  const loading = useNarrativeStore((s) => s.loading);
  const error = useNarrativeStore((s) => s.error);
  const universe = useNarrativeStore((s) => s.universe);
  const health = useNarrativeStore((s) => s.health);
  const entities = useNarrativeStore((s) => s.entities);
  const relationships = useNarrativeStore((s) => s.relationships);
  const threads = useNarrativeStore((s) => s.threads);
  const oracle = useNarrativeStore((s) => s.oracle);
  const echoes = useNarrativeStore((s) => s.echoes);
  const pressureZones = useNarrativeStore((s) => s.pressureZones);
  const simulations = useNarrativeStore((s) => s.simulations);
  const chronos = useNarrativeStore((s) => s.chronos);
  const characters = useNarrativeStore((s) => s.characters);
  const loadFromApi = useNarrativeStore((s) => s.loadFromApi);
  const updateHealth = useNarrativeStore((s) => s.updateHealth);

  return {
    source, loading, error, universe, health, entities,
    relationships, threads, oracle, echoes, pressureZones,
    simulations, chronos, characters,
    reload: loadFromApi, updateHealth,
  };
}
