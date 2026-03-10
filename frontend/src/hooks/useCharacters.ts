"use client";

import { useState, useCallback } from "react";
import { getCharacterDetails } from "@/lib/api";
import { useNarrativeStore } from "@/store/narrative";

type CharacterMeta = {
  goals?: string[];
  fears?: string[];
  beliefs?: string[];
  loyalties?: string[];
  desires?: string[];
  trust_edges?: Array<{ target: string; level: string }>;
  internal_conflicts?: string[];
  arc_phase?: string;
  arc_hint?: string;
  out_of_character_risk?: string;
};

export type CharacterDetail = {
  name?: string;
  summary?: string;
  metadata?: CharacterMeta;
  relationships?: Array<{ type: string; other: string }>;
  knowledge?: Array<{ fact_key: string; assertion_type: string; confidence: number }>;
};

export function useCharacters() {
  const characters = useNarrativeStore((s) => s.characters);
  const [details, setDetails] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async (characterId: string) => {
    setLoading(true);
    setError(null);
    setDetails(null);
    try {
      const d = await getCharacterDetails(characterId);
      setDetails(d as CharacterDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load character");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    characters,
    details,
    loading,
    error,
    loadDetails,
  };
}
