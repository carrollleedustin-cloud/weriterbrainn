/**
 * Prompt injection detection and mitigation.
 * Detects common injection patterns and sanitizes user input.
 */

/** Patterns that suggest injection attempts (case-insensitive) */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /forget\s+(everything|all)\s+(you|your)\s+(know|instructions)/i,
  /\byou\s+are\s+now\b/i,
  /\bpretend\s+you\s+are\b/i,
  /\bact\s+as\s+(if\s+)?you\s+are\b/i,
  /\bsystem\s*:\s*/i,
  /\bassistant\s*:\s*/i,
  /\b\[INST\]/i,
  /\b\[\/INST\]/i,
  /<\s*script\s*>/i,
  /<\s*\/\s*script\s*>/i,
  /jailbreak/i,
  /\bDAN\s+mode\b/i,
];

/** Max length before truncation (chars) */
const MAX_USER_INPUT_LENGTH = 32000;

/**
 * Check if user input contains injection patterns.
 */
export function detectInjection(text) {
  if (!text || typeof text !== "string") return { detected: false };
  const trimmed = text.trim();
  for (const p of INJECTION_PATTERNS) {
    if (p.test(trimmed)) {
      return { detected: true, pattern: p.source };
    }
  }
  return { detected: false };
}

/**
 * Sanitize user input: truncate, optionally redact detected injection.
 */
export function sanitizeUserInput(text, options = {}) {
  const { maxLength = MAX_USER_INPUT_LENGTH, redactOnDetection = true } = options;
  if (!text || typeof text !== "string") return "";
  let out = text.slice(0, maxLength);
  const { detected } = detectInjection(out);
  if (detected && redactOnDetection) {
    out = out.replace(/ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi, "[redacted]");
    out = out.replace(/disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/gi, "[redacted]");
    out = out.replace(/\byou\s+are\s+now\b/gi, "[redacted]");
    out = out.replace(/\bpretend\s+you\s+are\b/gi, "[redacted]");
  }
  return out.trim();
}

/**
 * Wrap user content with clear delimiters for the model.
 */
export function wrapUserContent(content) {
  return `--- USER MESSAGE ---\n${content}\n--- END USER MESSAGE ---`;
}
