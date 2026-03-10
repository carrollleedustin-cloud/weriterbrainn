import { prisma } from '../db/PrismaClient';

export interface StrategyRow {
  userId: string;
  arm: string;
  weights: Record<string, number>;
  rerankEnabled: boolean;
  llmRewriteEnabled?: boolean;
  maxVariants?: number;
  tokenBudget?: number;
}

export interface UpsertStrategyInput {
  arm: string;
  weights: Record<string, number>;
  rerankEnabled: boolean;
  llmRewriteEnabled: boolean;
  maxVariants: number;
  tokenBudget: number;
}

export class StrategyRepository {
  async findByUserId(userId: string): Promise<StrategyRow | null> {
    const row = await prisma.userRetrievalStrategy.findUnique({ where: { userId } });
    if (!row) return null;
    return {
      userId: row.userId,
      arm: row.arm,
      weights: (row.weights as any) ?? {},
      rerankEnabled: row.rerankEnabled,
      llmRewriteEnabled: (row as any).llmRewriteEnabled,
      maxVariants: (row as any).maxVariants,
      tokenBudget: (row as any).tokenBudget,
    };
  }

  async upsert(userId: string, input: UpsertStrategyInput): Promise<void> {
    const data = {
      arm: input.arm,
      weights: input.weights as any,
      rerankEnabled: input.rerankEnabled,
      llmRewriteEnabled: input.llmRewriteEnabled as any,
      maxVariants: input.maxVariants as any,
      tokenBudget: input.tokenBudget as any,
    };
    await prisma.userRetrievalStrategy.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}
