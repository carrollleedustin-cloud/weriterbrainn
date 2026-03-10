import { StrategyRepository } from '../../infrastructure/repositories/StrategyRepository';
import { redis } from '../../infrastructure/cache/redis';

export type ArmName = 'baseline' | 'rerank-heavy' | 'recency-boost' | 'importance-boost';

export interface StrategyConfig {
  weights: { vector: number; fts: number; importance: number; recency: number; tierBoost?: number };
  rerankEnabled: boolean;
  llmRewriteEnabled: boolean;
  maxVariants: number;
  tokenBudget: number;
}

const ARM_CONFIG: Record<ArmName, StrategyConfig> = {
  'baseline': { weights: { vector: 0.6, fts: 0.4, importance: 0.15, recency: 0.10, tierBoost: 0.08 }, rerankEnabled: false, llmRewriteEnabled: true, maxVariants: 5, tokenBudget: 1024 },
  'rerank-heavy': { weights: { vector: 0.45, fts: 0.35, importance: 0.10, recency: 0.10, tierBoost: 0.08 }, rerankEnabled: true, llmRewriteEnabled: true, maxVariants: 5, tokenBudget: 1024 },
  'recency-boost': { weights: { vector: 0.55, fts: 0.35, importance: 0.05, recency: 0.20, tierBoost: 0.08 }, rerankEnabled: false, llmRewriteEnabled: true, maxVariants: 4, tokenBudget: 896 },
  'importance-boost': { weights: { vector: 0.50, fts: 0.30, importance: 0.25, recency: 0.05, tierBoost: 0.08 }, rerankEnabled: false, llmRewriteEnabled: true, maxVariants: 4, tokenBudget: 896 },
};

function emaUpdate(prev: number, val: number, alpha = 0.2) {
  return alpha * val + (1 - alpha) * prev;
}

function emaKey(userId: string, arm: ArmName) {
  return `arm:ema:${userId}:${arm}`;
}

export class StrategyService {
  constructor(private repo: StrategyRepository) {}

  async getCurrent(userId: string) {
    const s = await this.repo.findByUserId(userId);
    if (!s) return { arm: 'baseline' as ArmName, ...ARM_CONFIG['baseline'] };
    const weights = s.weights ?? ARM_CONFIG['baseline'].weights;
    return {
      arm: s.arm as ArmName,
      weights,
      rerankEnabled: s.rerankEnabled,
      llmRewriteEnabled: s.llmRewriteEnabled ?? true,
      maxVariants: s.maxVariants ?? 5,
      tokenBudget: s.tokenBudget ?? 1024,
    };
  }

  async selectNext(userId: string, epsilon = 0.2) {
    const arms = Object.keys(ARM_CONFIG) as ArmName[];
    let chosen: ArmName | null = null;

    if (Math.random() < epsilon) {
      chosen = arms[Math.floor(Math.random() * arms.length)];
    } else {
      let best = -Infinity;
      for (const arm of arms) {
        const v = Number(await redis.get(emaKey(userId, arm))) || 0;
        if (v > best) { best = v; chosen = arm; }
      }
      if (!chosen) chosen = 'baseline';
    }

    const cfg = ARM_CONFIG[chosen];
    await this.repo.upsert(userId, {
      arm: chosen,
      weights: cfg.weights as Record<string, number>,
      rerankEnabled: cfg.rerankEnabled,
      llmRewriteEnabled: cfg.llmRewriteEnabled,
      maxVariants: cfg.maxVariants,
      tokenBudget: cfg.tokenBudget,
    });
    return { arm: chosen, ...cfg };
  }

  async recordReward(userId: string, arm: ArmName, reward: number) {
    const k = emaKey(userId, arm);
    const prev = Number(await redis.get(k)) || 0;
    const next = emaUpdate(prev, reward, 0.2);
    await redis.set(k, String(next));
    return next;
  }
}
