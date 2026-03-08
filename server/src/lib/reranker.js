/**
 * Optional reranking for retrieval results.
 * Uses MMR-like diversity: penalizes overlap with already-selected chunks (no embedding needed).
 */
function tokenize(text) {
  return (text || "").toLowerCase().match(/\b\w+\b/g) || [];
}

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersect = 0;
  for (const w of setA) {
    if (setB.has(w)) intersect++;
  }
  return intersect / (setA.size + setB.size - intersect);
}

/**
 * Rerank by diversity: prefer chunks that don't overlap heavily with already-selected ones.
 * @param {Array<{chunk_text: string, score: number, [key: string]: any}>} candidates
 * @param {{ lambda?: number, topK?: number }} options
 */
export function diversityRerank(candidates, options = {}) {
  const { lambda = 0.7, topK = 10 } = options;
  if (!candidates?.length || candidates.length <= topK) return candidates;

  const scored = [...candidates];
  const selected = [];

  while (selected.length < topK && scored.length > 0) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < scored.length; i++) {
      const rel = scored[i].score ?? 1;
      let maxOverlap = 0;
      for (const s of selected) {
        const overlap = jaccardSimilarity(
          scored[i].chunk_text || "",
          s.chunk_text || ""
        );
        maxOverlap = Math.max(maxOverlap, overlap);
      }
      const mmr = lambda * rel - (1 - lambda) * maxOverlap;
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    selected.push(scored.splice(bestIdx, 1)[0]);
  }

  return selected.length ? selected : candidates.slice(0, topK);
}
