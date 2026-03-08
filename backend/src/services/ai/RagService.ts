import { getTextEmbedding } from '../../infrastructure/ai/Embeddings';
import { hybridSearch, MemorySearchFilters, HybridWeights } from '../../infrastructure/search/hybrid/hybrid';
import { IRerankerClient, NoopReranker } from '../../infrastructure/ai/RerankerClient';
import { StrategyService } from '../analytics/StrategyService';
import { redis } from '../../infrastructure/cache/redis';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { config } from '../../lib/config';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export interface RetrieveRequest {
  userId: string;
  q: string;
  k?: number;
  filters?: MemorySearchFilters;
  weights?: HybridWeights;
  decay?: { halfLifeDays?: number };
  rerank?: boolean;
  rerankBlend?: number; // 0..1 weight for reranker score blending
  tokenBudget?: number; // for context assembly
  llmRewrite?: boolean; // enable LLM-assisted query rewriting
  maxVariants?: number; // cap on variants (defaults to 5)
  variantStrategy?: 'merge' | 'best';
}

export interface RetrieveResponse {
  results: Array<{
    id: string;
    content: string;
    score: number;
    importance: number;
    tier?: string;
    createdAt: string;
    tags: string[];
    type: string;
  }>;
  context: string;
  citations: Array<{ id: string; excerpt: string }>;
  diagnostics: any;
}

// Stable stringify (recursively sort object keys)
function stableStringify(v: any): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  const keys = Object.keys(v).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(',')}}`;
}

function hashKey(parts: any[]): string {
  const h = createHash('sha256');
  for (const p of parts) h.update(stableStringify(p));
  return h.digest('hex').slice(0, 32);
}

async function cacheGetJson<T>(key: string): Promise<T | null> {
  const v = await redis.get(key);
  if (!v) return null;
  try { return JSON.parse(v) as T; } catch { return null; }
}

async function cacheSetJson<T>(key: string, value: T, ttlSec: number) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
}

function rewriteQuerySimple(q: string): string[] {
  const base = q.trim();
  if (!base) return [];
  const dict: Record<string, string[]> = {
    project: ['initiative', 'workstream'],
    task: ['todo', 'action item'],
    goal: ['objective', 'target'],
    meeting: ['call', 'sync'],
    summary: ['overview', 'recap'],
  };
  const variants = new Set<string>([base]);
  for (const [k, syns] of Object.entries(dict)) {
    if (base.toLowerCase().includes(k)) syns.forEach(s => variants.add(base.replace(new RegExp(k, 'ig'), s)));
  }
  return Array.from(variants).slice(0, 5);
}

async function rewriteQueryLLM(q: string): Promise<string[]> {
  if (!config.openaiApiKey) return [];
  try {
    const sys = 'Rewrite the user query into up to 2 alternative phrasings or decomposed sub-queries. Return each variant on a new line, concise.';
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: `Query: ${q}` },
      ],
      temperature: 0,
      max_tokens: 80,
    });
    const out = (res.choices[0]?.message?.content ?? '').trim();
    const lines = out.split('\n').map(s => s.replace(/^[-\d\.)\s]+/, '').trim()).filter(Boolean);
    return lines.slice(0, 2);
  } catch {
    return [];
  }
}

function assembleContextSimple(items: { id: string; content: string }[], tokenBudget = 1024) {
  // Simple concatenation bounded by approx char limit (~4 chars per token heuristic)
  const maxChars = tokenBudget * 4;
  const citations: Array<{ id: string; excerpt: string }> = [];
  let context = '';
  for (const it of items) {
    const excerpt = it.content.length > 400 ? it.content.slice(0, 400) + '…' : it.content;
    const chunk = `- [id:${it.id}] ${excerpt}\n`;
    if ((context.length + chunk.length) > maxChars) break;
    context += chunk;
    citations.push({ id: it.id, excerpt });
  }
  return { context, citations };
}

async function assembleContextSmart(items: { id: string; content: string; tags: string[] }[], tokenBudget = 1024) {
  // Group by first tag, summarize group if needed
  const groups = new Map<string, { id: string; content: string }[]>();
  for (const it of items) {
    const key = it.tags?.[0] ?? 'general';
    const arr = groups.get(key) ?? [];
    arr.push({ id: it.id, content: it.content });
    groups.set(key, arr);
  }

  // If naive context fits, return simple
  const naive = assembleContextSimple(items, tokenBudget);
  if (naive.context.length < tokenBudget * 4 || !config.openaiApiKey) return naive;

  // Else, summarize group-wise until budget
  let context = '';
  const citations: Array<{ id: string; excerpt: string }> = [];
  for (const [key, arr] of groups.entries()) {
    const sample = arr.slice(0, 8).map(x => `(${x.id}) ${x.content.slice(0, 300)}`).join('\n');
    const sys = `Summarize the following memories for topic "${key}" into 1-2 sentences. Include references as [id:xxxx] for the most relevant ones. Be precise.`;
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [ { role: 'system', content: sys }, { role: 'user', content: sample } ],
      temperature: 0.2,
      max_tokens: 160,
    });
    const chunk = (res.choices[0]?.message?.content ?? '').trim();
    if (!chunk) continue;
    const line = `- ${chunk}\n`;
    if ((context.length + line.length) > tokenBudget * 4) break;
    context += line;
    // collect citations for first few
    for (const x of arr.slice(0, 3)) {
      const excerpt = x.content.length > 400 ? x.content.slice(0, 400) + '…' : x.content;
      citations.push({ id: x.id, excerpt });
    }
  }
  if (!context) return naive;
  return { context, citations };
}

export class RagService {
  constructor(
    private strategyService: StrategyService,
    private reranker: IRerankerClient = new NoopReranker()
  ) {}

  async retrieve(req: RetrieveRequest): Promise<RetrieveResponse> {
    const k = req.k ?? 20;
    const t0 = Date.now();

    // Load user strategy (unless overridden)
    if (!req.weights || typeof req.rerank === 'undefined' || typeof req.llmRewrite === 'undefined' || typeof req.maxVariants === 'undefined' || typeof req.tokenBudget === 'undefined') {
      const strat = await this.strategyService.getCurrent(req.userId);
      if (!req.weights) req.weights = strat.weights;
      if (typeof req.rerank === 'undefined') req.rerank = strat.rerankEnabled;
      if (typeof req.llmRewrite === 'undefined') req.llmRewrite = strat.llmRewriteEnabled;
      if (typeof req.maxVariants === 'undefined') req.maxVariants = strat.maxVariants;
      if (typeof req.tokenBudget === 'undefined') req.tokenBudget = strat.tokenBudget;
    }

    // Cache full retrieval result (short TTL)
    const reqKey = hashKey(['rag:v2', req.userId, req.q, req.k ?? 20, req.filters ?? {}, req.weights ?? {}, req.decay ?? {}, !!req.rerank, req.rerankBlend ?? 0.5, req.tokenBudget ?? 1024, req.llmRewrite ?? false, req.maxVariants ?? 5]);
    const cacheKey = `rag:${reqKey}`;
    const cached = await cacheGetJson<RetrieveResponse>(cacheKey);
    if (cached) {
      return { ...cached, diagnostics: { ...(cached.diagnostics ?? {}), cache: 'hit' } };
    }

    // Query rewriting
    const tRewrite0 = Date.now();
    const simpleVariants = rewriteQuerySimple(req.q);
    const llmVariants = req.llmRewrite ? await rewriteQueryLLM(req.q) : [];
    let variants = Array.from(new Set([req.q, ...simpleVariants, ...llmVariants]));
    const maxVariants = req.maxVariants ?? 5;
    variants = variants.slice(0, maxVariants);
    const tRewrite1 = Date.now();

    // Retrieve per variant
    const resultsMap = new Map<string, { item: any; score: number }>();
    const tRetrieve0 = Date.now();

    for (const v of variants) {
      // Cache embeddings
      const embKey = `emb:q:${hashKey([v])}`;
      let vec = await cacheGetJson<number[]>(embKey);
      if (!vec) {
        vec = await getTextEmbedding(v);
        await cacheSetJson(embKey, vec, 60 * 60); // 1h TTL
      }

      const batch = await hybridSearch({
        userId: req.userId,
        queryText: v,
        queryVec: vec,
        k: Math.max(k, 30),
        weights: req.weights,
        filters: req.filters,
        decay: req.decay,
        includeContent: true,
      });
      for (const r of batch) {
        const ex = resultsMap.get(r.id);
        if (!ex || r.score > ex.score) resultsMap.set(r.id, { item: r, score: r.score });
      }
    }

    let results = Array.from(resultsMap.values())
      .map(({ item, score }) => ({ ...item, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(k, 30));

    if (req.variantStrategy === 'best' && variants.length > 1) {
      const bestVariant = variants[0];
      const best = await hybridSearch({
        userId: req.userId,
        queryText: bestVariant,
        queryVec: await getTextEmbedding(bestVariant),
        k: Math.max(k, 30),
        weights: req.weights,
        filters: req.filters,
        decay: req.decay,
        includeContent: true,
      });
      results = best.slice(0, Math.max(k, 30));
    }

    const tRetrieve1 = Date.now();

    // Optional reranking on top-N
    const tRerank0 = Date.now();
    if (req.rerank && results.length > 0) {
      const items = results.map(r => ({ id: r.id, text: r.content }));
      const reranked = await this.reranker.rerank(req.q, items, Math.max(k, 30));
      const byId = new Map(reranked.map(r => [r.id, r.score] as const));
      const blend = typeof req.rerankBlend === 'number' ? Math.max(0, Math.min(1, req.rerankBlend)) : 0.5;
      results = results
        .map(r => {
          const rerankScore = byId.get(r.id);
          if (typeof rerankScore !== 'number') return r;
          return { ...r, score: (1 - blend) * r.score + blend * rerankScore };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
    } else {
      results = results.slice(0, k);
    }
    const tRerank1 = Date.now();

    // Context assembly (smart grouping with LLM fallback)
    const tCtx0 = Date.now();
    const { context, citations } = await assembleContextSmart(
      results.map(r => ({ id: r.id, content: r.content, tags: r.tags })),
      req.tokenBudget ?? 1024
    );
    const tCtx1 = Date.now();

    const response: RetrieveResponse = {
      results: results.map(r => ({
        id: r.id,
        content: r.content,
        score: r.score,
        importance: r.importance,
        tier: (r as any).tier,
        createdAt: r.createdAt.toISOString(),
        tags: r.tags,
        type: r.type, // return actual memory type
      })),
      context,
      citations,
      diagnostics: {
        variants,
        counts: { initial: resultsMap.size, returned: results.length },
        timingsMs: {
          total: Date.now() - t0,
          rewrite: tRewrite1 - tRewrite0,
          retrieve: tRetrieve1 - tRetrieve0,
          rerank: tRerank1 - tRerank0,
          assemble: tCtx1 - tCtx0,
        },
        cache: 'miss',
      },
    };

    // Cache final response (short TTL)
    await cacheSetJson(cacheKey, response, 60); // 1 minute TTL
    return response;
  }
}
