/**
 * Domain constants and types.
 * DB enums use uppercase; API uses lowercase.
 */

export const MEMORY_TYPES = Object.freeze([
  "conversation",
  "note",
  "idea",
  "document",
  "project",
  "belief",
  "goal",
]);

export const MEMORY_TYPE_TO_DB = Object.freeze({
  conversation: "CONVERSATION",
  note: "NOTE",
  idea: "IDEA",
  document: "DOCUMENT",
  project: "PROJECT",
  belief: "BELIEF",
  goal: "GOAL",
});

/** Priority for context assembly: higher = shown first to LLM */
export const MEMORY_TYPE_CONTEXT_PRIORITY = Object.freeze({
  belief: 6,
  goal: 5,
  project: 4,
  idea: 3,
  note: 2,
  document: 2,
  conversation: 1,
});

/** Semantic/long-term types vs episodic/short-term */
export const MEMORY_TYPE_IS_SEMANTIC = Object.freeze({
  belief: true,
  goal: true,
  project: true,
  note: true,
  document: true,
  idea: true,
  conversation: false,
});

export const NODE_TYPES = Object.freeze(["person", "concept", "project", "event", "other"]);

export const NODE_TYPE_TO_DB = Object.freeze({
  person: "PERSON",
  concept: "CONCEPT",
  project: "PROJECT",
  event: "EVENT",
  other: "OTHER",
});

export const MESSAGE_ROLES = Object.freeze({ USER: "user", ASSISTANT: "assistant", SYSTEM: "system" });

export const MESSAGE_ROLE_TO_DB = Object.freeze({
  user: "USER",
  assistant: "ASSISTANT",
  system: "SYSTEM",
});

export const ANALYTICS_EVENTS = Object.freeze([
  "response_accepted",
  "response_regenerated",
  "response_edited",
]);

/** Persona metric names for cognitive profile */
export const PERSONA_METRICS = Object.freeze([
  "avg_sentence_length",
  "vocab_complexity",
  "tone_score",
  "sentiment_avg",
  "question_ratio",
  "avg_message_length",
  "exclamation_ratio",
]);

// --- NIOS: Narrative Intelligence Operating System ---

export const NARRATIVE_OBJECT_TYPES = Object.freeze([
  "character",
  "event",
  "scene",
  "chapter",
  "book",
  "series",
  "location",
  "object",
  "faction",
  "plot_thread",
  "lore_rule",
  "secret",
  "theme",
  "motif",
  "emotional_beat",
  "promise",
  "payoff",
  "canon_fact",
  "other",
]);

export const NARRATIVE_OBJECT_TYPE_TO_DB = Object.freeze({
  character: "CHARACTER",
  event: "EVENT",
  scene: "SCENE",
  chapter: "CHAPTER",
  book: "BOOK",
  series: "SERIES",
  location: "LOCATION",
  object: "OBJECT",
  faction: "FACTION",
  plot_thread: "PLOT_THREAD",
  lore_rule: "LORE_RULE",
  secret: "SECRET",
  theme: "THEME",
  motif: "MOTIF",
  emotional_beat: "EMOTIONAL_BEAT",
  promise: "PROMISE",
  payoff: "PAYOFF",
  canon_fact: "CANON_FACT",
  other: "OTHER",
});

export const CANON_STATES = Object.freeze([
  "confirmed",
  "draft",
  "speculative",
  "deprecated",
  "branch_alt",
  "ambiguous",
]);

export const CANON_STATE_TO_DB = Object.freeze({
  confirmed: "CONFIRMED",
  draft: "DRAFT",
  speculative: "SPECULATIVE",
  deprecated: "DEPRECATED",
  branch_alt: "BRANCH_ALT",
  ambiguous: "AMBIGUOUS",
});

/** Semantic edge types for Story Knowledge Graph */
export const NARRATIVE_EDGE_TYPES = Object.freeze([
  "related_to",
  "character_present_at_event",
  "character_knows_secret",
  "character_betrayed_character",
  "character_loves",
  "character_fears",
  "event_causes_event",
  "event_advances_plot_thread",
  "scene_contains_event",
  "lore_rule_constrains_event",
  "secret_revealed_in_event",
  "theme_reinforced_by_scene",
  "promise_resolved_by_payoff",
]);
