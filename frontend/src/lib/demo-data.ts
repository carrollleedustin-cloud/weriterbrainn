/** NIO-OS seeded demo universe — narrative computing primitives */

export type NarrativeEntity = {
  id: string;
  name: string;
  type: "character" | "scene" | "event" | "location" | "secret" | "theme" | "conflict" | "motif";
  summary?: string;
  emotionalCharge?: number;
  narrativeSignificance?: number;
  visibility?: "omniscient" | "reader" | "character";
};

export type Relationship = {
  source: string;
  target: string;
  edge: "knows" | "suspects" | "loves" | "fears" | "betrayed" | "caused" | "concealed" | "witnessed" | "foreshadows";
};

export type PlotThread = {
  id: string;
  name: string;
  status: "rising" | "dormant" | "resolving" | "knot";
  heat: number;
  participants: string[];
};

export type OracleSignal = {
  id: string;
  type: "contradiction" | "warning" | "suggestion" | "fracture" | "echo";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  context?: string;
};

export const DEMO_UNIVERSE = {
  id: "uv-demo-1",
  name: "The River of Broken Oaths",
  seed: "A commander who betrayed his legion. A healer who cannot heal herself. A river that remembers.",
  narrativeHealth: 0.78,
  instability: 0.22,
  tensionLoad: 0.65,
};

export const DEMO_ENTITIES: NarrativeEntity[] = [
  {
    id: "c-marcus",
    name: "Marcus Valerius",
    type: "character",
    summary: "Legion commander. Betrayed his men at the Storm Gate. Carries the weight of the dead.",
    emotionalCharge: 0.92,
    narrativeSignificance: 0.95,
  },
  {
    id: "c-ilyra",
    name: "Ilyra",
    type: "character",
    summary: "Healer of the Vale. Cannot heal her own wound. Knows what Marcus did.",
    emotionalCharge: 0.88,
    narrativeSignificance: 0.9,
  },
  {
    id: "c-kassen",
    name: "Kassen",
    type: "character",
    summary: "Survivor of the Storm Gate. Believes Marcus dead. Hunts for truth.",
    emotionalCharge: 0.85,
    narrativeSignificance: 0.8,
  },
  {
    id: "e-storm-gate",
    name: "Storm Gate Collapse",
    type: "event",
    summary: "Marcus ordered retreat. Half the legion drowned. He called it necessity.",
    emotionalCharge: 0.95,
    narrativeSignificance: 0.98,
  },
  {
    id: "s-betrayal",
    name: "The Betrayal",
    type: "secret",
    summary: "Marcus chose to save himself. Ilyra knows. Kassen does not.",
    emotionalCharge: 0.98,
    narrativeSignificance: 0.99,
  },
  {
    id: "loc-river",
    name: "The Remnant River",
    type: "location",
    summary: "The river that swallowed the legion. It hums with the dead. It remembers.",
    emotionalCharge: 0.7,
    narrativeSignificance: 0.85,
  },
  {
    id: "th-redemption",
    name: "Redemption / Impossible Return",
    type: "theme",
    summary: "Can betrayal be undone? The river does not forget.",
    emotionalCharge: 0.8,
    narrativeSignificance: 0.9,
  },
];

export const DEMO_RELATIONSHIPS: Relationship[] = [
  { source: "c-marcus", target: "c-ilyra", edge: "concealed" },
  { source: "c-ilyra", target: "c-marcus", edge: "knows" },
  { source: "c-kassen", target: "c-marcus", edge: "suspects" },
  { source: "c-marcus", target: "e-storm-gate", edge: "caused" },
  { source: "c-ilyra", target: "s-betrayal", edge: "knows" },
  { source: "c-marcus", target: "s-betrayal", edge: "concealed" },
  { source: "e-storm-gate", target: "th-redemption", edge: "foreshadows" },
];

export const DEMO_THREADS: PlotThread[] = [
  { id: "t-1", name: "Betrayal Reveal", status: "rising", heat: 0.9, participants: ["c-marcus", "c-ilyra", "c-kassen"] },
  { id: "t-2", name: "Ilyra's Wound", status: "dormant", heat: 0.5, participants: ["c-ilyra"] },
  { id: "t-3", name: "River's Memory", status: "rising", heat: 0.7, participants: ["loc-river", "e-storm-gate"] },
  { id: "t-4", name: "Kassen's Hunt", status: "knot", heat: 0.85, participants: ["c-kassen", "c-marcus"] },
];

export const DEMO_ORACLE: OracleSignal[] = [
  { id: "o-1", type: "warning", message: "Secret exposure risk rising. Ilyra's silence is unstable.", severity: "medium", context: "Scene 12" },
  { id: "o-2", type: "suggestion", message: "Echo opportunity: Storm Gate imagery could mirror the final confession.", severity: "low" },
  { id: "o-3", type: "fracture", message: "Timeline discontinuity: Marcus's whereabouts in Act II unclear.", severity: "high" },
  { id: "o-4", type: "echo", message: "River hum established in Ch.1 — reinforce before climax.", severity: "low" },
];

export const STYLE_DNA = {
  sentenceRhythm: 0.82,
  tonalSpectrum: "cinematic",
  emotionalRegister: "elevated",
  metaphorDensity: 0.75,
  dialogueCadence: "sparse, weighted",
  voiceConsistency: 0.88,
};

export const MIRROR_VARIATIONS = [
  { id: "mythic", label: "Mythic", text: "I am the architect of worlds that breathe with the weight of the ancient." },
  { id: "intimate", label: "Intimate", text: "I write to understand what I cannot say aloud." },
  { id: "brutal", label: "Brutal", text: "Stories are wounds that refuse to close. I open them." },
  { id: "cinematic", label: "Cinematic", text: "I see the scene before I write it. Motion, light, consequence." },
  { id: "literary", label: "Literary", text: "Language is the only ritual I trust." },
  { id: "prophetic", label: "Prophetic", text: "I write what has not happened yet. The story knows more than I do." },
];

export const GRAVITY_OPTIONS = [
  { id: "genre", label: "Genre gravity", range: [0, 1], value: 0.7 },
  { id: "tonal", label: "Tonal spectrum", range: [0, 1], value: 0.6 },
  { id: "intensity", label: "Emotional intensity", range: [0, 1], value: 0.85 },
  { id: "mythic", label: "Mythic density", range: [0, 1], value: 0.5 },
  { id: "complexity", label: "Structural complexity", range: [0, 1], value: 0.72 },
  { id: "instability", label: "Timeline instability", range: [0, 1], value: 0.4 },
];

export type Echo = { id: string; source: string; target: string; type: string; resonance: number };

export const DEMO_ECHOES: Echo[] = [
  { id: "e1", source: "Betrayal in Act I", target: "Silent vow in Act III", type: "betrayal", resonance: 0.92 },
  { id: "e2", source: "Storm Gate collapse", target: "River betrayal ripple", type: "imagery", resonance: 0.88 },
  { id: "e3", source: "Constellation oath", target: "Final tribunal", type: "thematic", resonance: 0.85 },
  { id: "e4", source: "River hum", target: "Deathbed confession", type: "motif", resonance: 0.78 },
];

export type PressureZone = { id: string; label: string; intensity: number; type: "cold" | "overloaded" | "climax" | "dead" | "fault" };

export const DEMO_PRESSURE_ZONES: PressureZone[] = [
  { id: "z1", label: "Ch.1–2", intensity: 0.3, type: "cold" },
  { id: "z2", label: "Storm Gate", intensity: 0.95, type: "climax" },
  { id: "z3", label: "Ch.4–5", intensity: 0.45, type: "dead" },
  { id: "z4", label: "Reveal scene", intensity: 0.9, type: "overloaded" },
  { id: "z5", label: "Timeline gap", intensity: 0.7, type: "fault" },
];

export type SimulationScenario = { id: string; question: string; outcome: string; risk: number };

export const DEMO_SIMULATIONS: SimulationScenario[] = [
  { id: "s1", question: "What if the confession occurs in Act I?", outcome: "Tragic inevitability collapses. Reader loses discovery.", risk: 0.85 },
  { id: "s2", question: "What collapses if Marcus dies in Ch.4?", outcome: "Kassen's hunt loses target. Ilyra's wound unresolved.", risk: 0.92 },
  { id: "s3", question: "Which branch maximizes emotional debt?", outcome: "Delay betrayal reveal until Act III, Scene 8.", risk: 0.6 },
];
