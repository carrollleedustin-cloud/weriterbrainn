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
