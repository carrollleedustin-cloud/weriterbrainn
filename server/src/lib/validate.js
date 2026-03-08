/**
 * Zod validation schemas for API payloads.
 * Centralizes input validation and error shaping.
 */
import { z } from "zod";

// --- Memory ---
export const createMemorySchema = z.object({
  content: z.string().min(1, "content required").max(100000, "content too long"),
  memory_type: z
    .enum(["conversation", "note", "idea", "document", "project", "belief", "goal"])
    .default("note"),
  title: z.string().max(500).nullable().optional(),
});

export const searchMemoriesSchema = z.object({
  q: z.string().min(1, "query required").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  memory_type: z
    .enum(["conversation", "note", "idea", "document", "project", "belief", "goal"])
    .optional(),
  tier: z.enum(["short_term", "long_term"]).optional(),
});

export const consolidateMemoriesSchema = z.object({
  older_than_days: z.coerce.number().int().min(1).max(365).default(7),
  batch_limit: z.coerce.number().int().min(1).max(100).default(20),
});

// --- Chat ---
export const chatSchema = z.object({
  message: z.string().min(1, "message required").max(32000, "message too long"),
  conversation_id: z.string().uuid().nullable().optional(),
  stream: z.boolean().optional(),
});

// --- Knowledge Graph ---
export const extractSchema = z.object({
  text: z.string().min(1, "text required").max(50000, "text too long"),
});

export const graphSearchSchema = z.object({
  q: z.string().min(1, "query required"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// --- NIOS: Narrative ---
export const narrativeExtractSchema = z.object({
  text: z.string().min(1, "text required").max(50000, "text too long"),
});

export const narrativeCompileSchema = z.object({
  text: z.string().min(1, "text required").max(50000, "text too long"),
});

export const narrativeQuerySchema = z.object({
  q: z.string().min(1, "query required").max(2000),
});

// --- Persona ---
export const recordPersonaSchema = z.object({
  text: z.string().min(1, "text required").max(50000, "text too long"),
});

// --- Analytics ---
export const analyticsEventSchema = z.object({
  event_type: z.enum(["response_accepted", "response_regenerated", "response_edited"]),
  payload: z.record(z.unknown()).optional(),
});

// --- Auth ---
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "password required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "password must be at least 8 characters"),
  display_name: z.string().max(255).optional(),
});
