/**
 * Token estimation and budget-aware truncation.
 * Uses ~4 chars/token for English (GPT family approximation).
 */
const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count for a string.
 */
export function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate text to fit within token budget.
 */
export function truncateToTokens(text, maxTokens) {
  if (!text || maxTokens <= 0) return "";
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + "...";
}

/**
 * Assemble segments into a string that stays under maxTokens.
 * Adds segments in order until budget is exceeded.
 */
export function assembleUnderBudget(segments, maxTokens, separators = { prefix: "\n\n", item: "\n- " }) {
  let out = "";
  let used = 0;
  for (const seg of segments) {
    const add = typeof seg === "string" ? seg : seg.text;
    const tokens = estimateTokens(add);
    const sep = out ? (separators.item ?? "\n- ") : "";
    const sepTokens = estimateTokens(sep);
    if (used + sepTokens + tokens > maxTokens) {
      const space = maxTokens - used - sepTokens - 10;
      if (space > 50) {
        out += sep + truncateToTokens(add, Math.floor(space / CHARS_PER_TOKEN));
      }
      break;
    }
    out += (out ? sep : "") + add;
    used += (out ? sepTokens : 0) + tokens;
  }
  return out;
}
