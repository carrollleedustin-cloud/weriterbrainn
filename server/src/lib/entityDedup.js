/**
 * Entity name similarity for deduplication.
 * Uses normalized token overlap; no external deps.
 */
function normalize(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s) {
  return (s || "").split(/\s+/).filter(Boolean);
}

/**
 * Jaccard similarity of token sets.
 */
function tokenSimilarity(a, b) {
  const setA = new Set(tokenize(normalize(a)));
  const setB = new Set(tokenize(normalize(b)));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersect = 0;
  for (const t of setA) {
    if (setB.has(t)) intersect++;
  }
  return intersect / (setA.size + setB.size - intersect);
}

/**
 * Check if name A is contained in B or vice versa (for "John" vs "John Smith").
 */
function containmentScore(a, b) {
  const ta = tokenize(normalize(a));
  const tb = tokenize(normalize(b));
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  const intersect = ta.filter((t) => setB.has(t)).length;
  return Math.max(intersect / setA.size, intersect / setB.size);
}

/**
 * Combined similarity: Jaccard + containment boost.
 */
export function nameSimilarity(a, b) {
  const j = tokenSimilarity(a, b);
  const c = containmentScore(a, b);
  return Math.max(j, c * 0.9);
}
