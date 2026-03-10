export type Tab = "universe" | "compile" | "timeline" | "threads" | "strategy" | "canon" | "qa" | "oracle" | "heatmap";

export const VALID_TABS: Tab[] = ["universe", "compile", "timeline", "threads", "strategy", "canon", "qa", "oracle", "heatmap"];

export type NarrativeObject = {
  id: string;
  object_type: string;
  name: string;
  summary?: string;
  canon_state?: string;
  created_at?: string;
};

export type NarrativeEdge = {
  id?: string;
  source_id: string;
  target_id: string;
  edge_type: string;
};

export type CompileIssue = {
  issue_id?: string;
  category?: string;
  severity?: string;
  summary: string;
  confidence?: number;
  affected_entities?: string[];
  evidence?: string;
  source_passage?: string;
  related_canon?: string;
  suggested_resolution?: string;
};

export type CompileResult = {
  alerts?: Array<{ tier: string; summary: string; confidence?: number; source_passage?: string; related_canon?: string; suggested_resolution?: string }>;
  issues?: CompileIssue[];
  overall_tier: string;
  overall_severity?: string;
  explanation_path?: { stages_run?: string[]; canon_facts_used?: unknown[]; issue_count?: number };
};

export type TimelineEvent = {
  id: string;
  name: string;
  summary?: string;
  temporal?: unknown;
  caused_by?: Array<{ event_id: string; name: string }>;
};

export type PlotThread = {
  id: string;
  name: string;
  summary?: string;
  status: string;
  related_events?: string[];
};

export type StrategyResult = {
  summary?: string;
  suggestions?: Array<{ title: string; description: string; priority?: string }>;
  opportunities?: Array<{ title: string; description: string }>;
  [key: string]: unknown;
};

export type QAResult = {
  answer: string;
  citations: Array<{ type: string; name: string; excerpt: string }>;
  confidence: number;
  reasoning_summary?: string;
  related_entities?: Array<{ name: string; role: string }>;
  ambiguity_notes?: string[];
  contradictory_evidence?: string[];
};

export type PreviewResult = {
  impacts?: Array<{ type: string; target: string; description: string; severity: string }>;
  impacted_canon_facts?: Array<{ fact_value: string; impact: string }>;
  impacted_threads?: Array<{ name: string; impact: string }>;
  impacted_characters?: Array<{ name: string; impact: string }>;
  blast_radius?: { scene?: number; chapter?: number; book?: number; universe?: number };
  risk_score?: number;
  opportunity_score?: number;
  summary: string;
  delta_summary?: string;
  compile_alerts?: unknown[];
};

export type CanonFact = {
  id: string;
  fact_value?: string;
  fact_type: string;
  confidence?: number;
  canon_state?: string;
  source_passage?: string;
};

export function typeColor(t: string): string {
  switch (t) {
    case "character": return "#22c55e";
    case "event": return "#f59e0b";
    case "location": return "#3b82f6";
    case "plot_thread": return "#a855f7";
    case "secret": return "#ef4444";
    default: return "#c084fc";
  }
}
