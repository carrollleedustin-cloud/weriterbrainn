export type Character = {
  id: string;
  name: string;
  summary?: string;
  metadata?: Record<string, unknown>;
};

export type CharacterDetailView = {
  name?: string;
  summary?: string;
  metadata?: {
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
  relationships?: Array<{ type: string; other: string }>;
  knowledge?: Array<{ fact_key: string; assertion_type: string; confidence: number }>;
};
