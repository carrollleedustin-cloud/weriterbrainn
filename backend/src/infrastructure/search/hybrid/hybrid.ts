import { prisma } from '../../db/PrismaClient';

export type MemoryType = 'EPISODIC' | 'SEMANTIC' | 'PROJECT' | 'GOAL' | 'BELIEF';
export type MemoryTier = 'SHORT_TERM' | 'LONG_TERM';

export interface MemorySearchResult {
  id: string;
  type: MemoryType;
  content: string;
  tags: string[];
  createdAt: Date;
  importance: number;
  tier?: MemoryTier;
  score: number; // normalized 0..1 for the reported source/final
  source: 'vector' | 'fts' | 'hybrid';
}

export interface MemorySearchFilters {
  types?: MemoryType[];
  tiers?: MemoryTier[];
  tags?: string[]; // any overlap
  from?: Date; // createdAt >= from
  to?: Date;   // createdAt <= to
  minImportance?: number; // >= threshold
}

export interface HybridWeights {
  vector?: number;      // default 0.6
  fts?: number;         // default 0.4
  importance?: number;  // default 0.15 (added after base fusion)
  recency?: number;     // default 0.10 (added after base fusion)
  tierBoost?: number;   // default 0.08 (boost SHORT_TERM tier)
}

export interface DecayOptions {
  halfLifeDays?: number; // default 30
}

function toVectorLiteral(vec: number[]): string {
  // pgvector literal: [v1, v2, ...]
  return `[${vec.join(',')}]`;
}

function normalizeScores<T extends { score: number }>(items: T[]): T[] {
  if (items.length === 0) return items;
  let min = Infinity;
  let max = -Infinity;
  for (const it of items) {
    if (it.score < min) min = it.score;
    if (it.score > max) max = it.score;
  }
  if (max === min) return items.map((it) => ({ ...it, score: 1 }));
  return items.map((it) => ({ ...it, score: (it.score - min) / (max - min) }));
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

function ageDays(d: Date) {
  const ms = Date.now() - new Date(d).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function decayFactor(d: Date, halfLifeDays: number) {
  const a = ageDays(d);
  const lambda = Math.log(2) / halfLifeDays;
  return Math.exp(-lambda * a);
}

function matchFilters(item: MemorySearchResult, filters?: MemorySearchFilters): boolean {
  if (!filters) return true;
  if (filters.types && filters.types.length > 0 && !filters.types.includes(item.type)) return false;
  if (filters.tiers && filters.tiers.length > 0 && item.tier && !filters.tiers.includes(item.tier)) return false;
  if (filters.tags && filters.tags.length > 0) {
    const s = new Set(item.tags || []);
    const overlaps = filters.tags.some(t => s.has(t));
    if (!overlaps) return false;
  }
  if (filters.from && item.createdAt < filters.from) return false;
  if (filters.to && item.createdAt > filters.to) return false;
  if (typeof filters.minImportance === 'number' && (item.importance ?? 0) < filters.minImportance) return false;
  return true;
}

export async function vectorSearch(params: {
  userId: string;
  queryVec: number[];
  k?: number;
}): Promise<MemorySearchResult[]> {
  const { userId, queryVec, k = 20 } = params;
  const vecLiteral = toVectorLiteral(queryVec);
  // Using queryRawUnsafe due to pgvector literal; ensure queryVec originates from trusted computation
  const sql = `
    SELECT id, content, "createdAt", importance, tags, type, tier,
           (1 - (embedding_vec <-> ${vecLiteral})) AS score
    FROM "Memory"
    WHERE "userId" = $1 AND embedding_vec IS NOT NULL
    ORDER BY embedding_vec <-> ${vecLiteral}
    LIMIT ${Number(k)}
  `;
  const rows = await prisma.$queryRawUnsafe<any[]>(sql, userId);
  const mapped = rows.map((r: any) => ({
    id: r.id,
    type: r.type as MemoryType,
    content: r.content,
    tags: (r.tags ?? []) as string[],
    createdAt: r.createdAt,
    importance: r.importance ?? 0,
    tier: r.tier as MemoryTier,
    score: Number(r.score) || 0,
    source: 'vector' as const,
  }));
  return normalizeScores(mapped);
}

export async function ftsSearch(params: {
  userId: string;
  queryText: string;
  k?: number;
}): Promise<MemorySearchResult[]> {
  const { userId, queryText, k = 20 } = params;
  const rows = await prisma.$queryRaw<any[]>`
    SELECT id, content, "createdAt", importance, tags, type, tier,
           ts_rank_cd("content_tsv", plainto_tsquery('english', ${queryText})) AS score
    FROM "Memory"
    WHERE "userId" = ${userId}
      AND "content_tsv" @@ plainto_tsquery('english', ${queryText})
    ORDER BY score DESC
    LIMIT ${k}
  `;
  const mapped = rows.map((r: any) => ({
    id: r.id,
    type: r.type as MemoryType,
    content: r.content,
    tags: (r.tags ?? []) as string[],
    createdAt: r.createdAt,
    importance: r.importance ?? 0,
    tier: r.tier as MemoryTier,
    score: Number(r.score) || 0,
    source: 'fts' as const,
  }));
  return normalizeScores(mapped);
}

export async function hybridSearch(params: {
  userId: string;
  queryVec?: number[];
  queryText?: string;
  k?: number;
  weights?: HybridWeights;
  filters?: MemorySearchFilters;
  decay?: DecayOptions;
  includeContent?: boolean;
}): Promise<MemorySearchResult[]> {
  const { userId, queryVec, queryText, k = 20, weights, filters, decay, includeContent = true } = params;
  const wv = weights?.vector ?? 0.6;
  const wt = weights?.fts ?? 0.4;
  const wi = weights?.importance ?? 0.15;
  const wd = weights?.recency ?? 0.10;
  const halfLife = decay?.halfLifeDays ?? 30;
  const wtier = weights?.tierBoost ?? 0.08;

  const [vecResults, ftsResults] = await Promise.all([
    queryVec ? vectorSearch({ userId, queryVec, k: Math.max(k, 20) }) : Promise.resolve([]),
    queryText ? ftsSearch({ userId, queryText, k: Math.max(k, 20) }) : Promise.resolve([]),
  ]);

  if (!queryVec && !queryText) return [];

  const byId = new Map<string, { v?: number; t?: number; base?: Omit<MemorySearchResult, 'score' | 'source'> }>();

  for (const r of vecResults) {
    byId.set(r.id, { v: r.score, base: { id: r.id, type: r.type, content: r.content, tags: r.tags, createdAt: r.createdAt, importance: r.importance, tier: r.tier } });
  }
  for (const r of ftsResults) {
    const ex = byId.get(r.id);
    if (ex) {
      ex.t = r.score;
    } else {
      byId.set(r.id, { t: r.score, base: { id: r.id, type: r.type, content: r.content, tags: r.tags, createdAt: r.createdAt, importance: r.importance, tier: r.tier } });
    }
  }

  // Fuse and apply filters/weights
  const fused: MemorySearchResult[] = [];
  for (const { base, v, t } of byId.values()) {
    if (!base) continue;
    let vs = v ?? 0;
    let ts = t ?? 0;
    // base fusion
    let s = (wv * vs) + (wt * ts);
    // importance and recency adjustments
    const imp = clamp01(base.importance ?? 0);
    const rec = clamp01(decayFactor(base.createdAt, halfLife));
    const tierBoost = base.tier === 'SHORT_TERM' ? wtier : 0;
    s += wi * imp + wd * rec + tierBoost;

    fused.push({
      id: base.id,
      type: base.type,
      content: includeContent ? base.content : '',
      tags: base.tags,
      createdAt: base.createdAt,
      importance: base.importance ?? 0,
      tier: base.tier,
      score: s,
      source: (v && t) ? 'hybrid' : (v ? 'vector' : 'fts'),
    });
  }

  // Apply filters after fusion
  const filtered = fused.filter(item => matchFilters(item, filters));

  // Normalize final scores and sort
  const normalized = normalizeScores(filtered);
  normalized.sort((a, b) => b.score - a.score);
  return normalized.slice(0, k);
}
