/**
 * NIO-OS Demo Data Service
 *
 * Single source of truth for all demo/seed/mock data.
 * All pages should import demo data from here rather than
 * defining inline constants.
 *
 * The service provides a clean boundary that can later be
 * replaced by real API calls without touching page components.
 */

import {
  DEMO_UNIVERSE,
  DEMO_ENTITIES,
  DEMO_RELATIONSHIPS,
  DEMO_THREADS,
  DEMO_ORACLE,
  DEMO_ECHOES,
  DEMO_PRESSURE_ZONES,
  DEMO_SIMULATIONS,
  STYLE_DNA,
  MIRROR_VARIATIONS,
  GRAVITY_OPTIONS,
  type NarrativeEntity,
  type Relationship,
  type PlotThread,
  type OracleSignal,
  type Echo,
  type PressureZone,
  type SimulationScenario,
} from "./demo-data";

// ---------------------------------------------------------------------------
// Simulation dimension mock data
// ---------------------------------------------------------------------------

export type SimOperation = {
  id: string;
  label: string;
  icon: string;
};

export const SIMULATION_OPERATIONS: SimOperation[] = [
  { id: "move-reveal", label: "Move reveal earlier", icon: "↰" },
  { id: "remove-event", label: "Remove event", icon: "✕" },
  { id: "kill-character", label: "Kill character", icon: "☠" },
  { id: "merge-threads", label: "Merge threads", icon: "⤨" },
  { id: "switch-pov", label: "Switch POV", icon: "◎" },
  { id: "delay-betrayal", label: "Delay betrayal", icon: "⏳" },
  { id: "intensify", label: "Intensify romance", icon: "♥" },
  { id: "flatten", label: "Flatten subplot", icon: "—" },
  { id: "sharpen-theme", label: "Sharpen theme", icon: "◆" },
  { id: "add-consequence", label: "Increase consequence", icon: "⚡" },
];

export type SimResult = {
  id: string;
  question: string;
  outcome: string;
  risk: number;
  cascadeEffects: string[];
  collapsed: string[];
  amplified: string[];
};

const SIMULATION_RESULTS: Record<string, SimResult> = {
  "move-reveal": {
    id: "sim-1",
    question: "What if the confession occurs in Act I?",
    outcome:
      "Tragic inevitability collapses. Reader loses discovery arc. Kassen's hunt becomes aimless.",
    risk: 0.85,
    cascadeEffects: [
      "Betrayal Reveal thread → premature resolution",
      "Secret Heat drops to 0",
      "Reader confusion peaks in Ch.3–5",
    ],
    collapsed: ["Betrayal Reveal", "Kassen's Hunt"],
    amplified: ["Ilyra's Wound"],
  },
  "kill-character": {
    id: "sim-2",
    question: "What collapses if Marcus dies in Ch.4?",
    outcome:
      "Kassen's hunt loses target. Ilyra's wound becomes permanent. Redemption theme unresolvable.",
    risk: 0.92,
    cascadeEffects: [
      "3 threads lose primary participant",
      "Tension load drops 40%",
      "Theme coherence fractures",
    ],
    collapsed: ["Betrayal Reveal", "River's Memory"],
    amplified: ["Ilyra's Wound — escalates to central thread"],
  },
  "delay-betrayal": {
    id: "sim-3",
    question: "Which branch maximizes emotional debt?",
    outcome:
      "Delay betrayal reveal until Act III, Scene 8. Kassen and Ilyra forced into alliance.",
    risk: 0.6,
    cascadeEffects: [
      "Emotional debt +35%",
      "Tension load sustained through mid-act",
      "Reader suspense peaks",
    ],
    collapsed: [],
    amplified: ["Betrayal Reveal", "Kassen's Hunt", "Ilyra's Wound"],
  },
};

export function getSimulationResult(opId: string): SimResult {
  return (
    SIMULATION_RESULTS[opId] ?? {
      id: `sim-${Date.now()}`,
      question: `What if we apply "${opId}"?`,
      outcome: "Cascade analysis in progress. Multiple thread perturbations detected.",
      risk: 0.5 + Math.random() * 0.4,
      cascadeEffects: ["Thread destabilization detected", "Oracle recalibrating"],
      collapsed: [],
      amplified: [],
    }
  );
}

// ---------------------------------------------------------------------------
// Dreamscape dimension mock data
// ---------------------------------------------------------------------------

export type Archetype = {
  id: string;
  name: string;
  glyph: string;
  description: string;
  prompt: string;
  color: string;
};

export const DREAMSCAPE_ARCHETYPES: Archetype[] = [
  {
    id: "shadow",
    name: "The Shadow",
    glyph: "◐",
    description:
      "The disowned self. Repressed desire, hidden fear, the character's nightmare mirror.",
    prompt:
      "Write what your protagonist cannot admit. Name the fear they are performing courage to hide.",
    color: "rgba(244,63,94,0.7)",
  },
  {
    id: "anima",
    name: "Anima / Animus",
    glyph: "☽",
    description:
      "The contrasexual archetype. Projection of the unlived feminine or masculine.",
    prompt:
      "Write the scene your character would never let anyone witness. What tenderness or fury is buried?",
    color: "rgba(192,132,252,0.7)",
  },
  {
    id: "trickster",
    name: "The Trickster",
    glyph: "⟐",
    description:
      "Rule-breaker. Boundary-dissolver. Comic disruption of rigid structure.",
    prompt:
      "Let the trickster speak. Break a rule of your story's world. What sacred thing gets mocked?",
    color: "rgba(251,191,36,0.7)",
  },
  {
    id: "sage",
    name: "The Sage",
    glyph: "◇",
    description:
      "Seeker of truth. The one who sees the pattern. Cost: paralysis through knowing.",
    prompt:
      "Write what the wisest character in your universe would say to the most reckless.",
    color: "rgba(139,92,246,0.7)",
  },
  {
    id: "threshold",
    name: "The Threshold Guardian",
    glyph: "⫿",
    description:
      "Tests worthiness. Blocks passage. Sometimes the gate, sometimes the lock.",
    prompt:
      "What test must be passed before the story can continue? What would failure look like?",
    color: "rgba(99,102,241,0.7)",
  },
  {
    id: "child",
    name: "The Divine Child",
    glyph: "✧",
    description:
      "Pure potential. The future. What is being born. Vulnerability as power.",
    prompt:
      "Write the moment something fragile, new, and terrifyingly vulnerable enters the story.",
    color: "rgba(52,211,153,0.7)",
  },
];

export type DreamSymbol = {
  id: string;
  glyph: string;
  name: string;
  meaning: string;
};

export const DREAMSCAPE_SYMBOLS: DreamSymbol[] = [
  { id: "water", glyph: "≈", name: "Water", meaning: "Unconscious, emotion, purification, dissolution" },
  { id: "fire", glyph: "△", name: "Fire", meaning: "Transformation, destruction, illumination, passion" },
  { id: "mirror", glyph: "◈", name: "Mirror", meaning: "Self-knowledge, truth, vanity, duality" },
  { id: "door", glyph: "⊞", name: "Threshold", meaning: "Transition, choice, no return, opportunity" },
  { id: "dark", glyph: "●", name: "Darkness", meaning: "Unknown, unconscious, gestation, fear" },
  { id: "tree", glyph: "⌘", name: "World Tree", meaning: "Connection, growth, roots, cosmic axis" },
  { id: "spiral", glyph: "◎", name: "Spiral", meaning: "Return, evolution, cycles, deepening" },
  { id: "wound", glyph: "†", name: "Sacred Wound", meaning: "Source of power, catalyst, the break that lets light in" },
];

// ---------------------------------------------------------------------------
// Nexus Collab dimension mock data
// ---------------------------------------------------------------------------

export type Collaborator = {
  id: string;
  name: string;
  role: string;
  color: string;
  activeRegion: string;
  lastAction: string;
  presenceMs: number;
};

export type LoreConflict = {
  id: string;
  description: string;
  authors: string[];
  severity: "low" | "medium" | "high";
};

export const COLLAB_COLLABORATORS: Collaborator[] = [
  { id: "c1", name: "You", role: "Architect", color: "rgba(139,92,246,0.8)", activeRegion: "Act III — Climax", lastAction: "Editing Ch.9 revelation scene", presenceMs: 0 },
  { id: "c2", name: "Avery Lune", role: "Weaver", color: "rgba(52,211,153,0.8)", activeRegion: "Act II — Rising", lastAction: "Restructured Kassen subplot", presenceMs: 45000 },
  { id: "c3", name: "Cassian Drift", role: "Observer", color: "rgba(251,191,36,0.8)", activeRegion: "Character Forge", lastAction: "Added notes on Ilyra motivation", presenceMs: 120000 },
  { id: "c4", name: "Maren Vex", role: "Weaver", color: "rgba(244,63,94,0.8)", activeRegion: "Loom of Fate", lastAction: "Created new betrayal thread branch", presenceMs: 300000 },
];

export const COLLAB_LORE_CONFLICTS: LoreConflict[] = [
  { id: "lc1", description: "Kassen's age inconsistency — Ch.2 says 34, Ch.7 implies early 40s", authors: ["You", "Avery Lune"], severity: "medium" },
  { id: "lc2", description: "Timeline contradiction: the siege and the wedding cannot both occur on the same day", authors: ["Maren Vex", "You"], severity: "high" },
  { id: "lc3", description: "Minor: throne room described as obsidian in Ch.1, marble in Ch.4", authors: ["Cassian Drift"], severity: "low" },
];

export const COLLAB_ROLE_PERMISSIONS: Record<string, string[]> = {
  Architect: ["Full edit", "Thread control", "Simulation", "Merge authority", "Role assignment"],
  Weaver: ["Chapter edit", "Thread branching", "Character edit"],
  Observer: ["Comment", "Annotate", "Suggest"],
};

// ---------------------------------------------------------------------------
// Re-exports from demo-data.ts (canonical types and seed data)
// ---------------------------------------------------------------------------

export {
  DEMO_UNIVERSE,
  DEMO_ENTITIES,
  DEMO_RELATIONSHIPS,
  DEMO_THREADS,
  DEMO_ORACLE,
  DEMO_ECHOES,
  DEMO_PRESSURE_ZONES,
  DEMO_SIMULATIONS,
  STYLE_DNA,
  MIRROR_VARIATIONS,
  GRAVITY_OPTIONS,
};

export type {
  NarrativeEntity,
  Relationship,
  PlotThread,
  OracleSignal,
  Echo,
  PressureZone,
  SimulationScenario,
};
