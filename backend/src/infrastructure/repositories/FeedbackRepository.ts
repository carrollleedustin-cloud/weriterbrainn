import { prisma } from '../db/PrismaClient';

export type FeedbackType = 'accepted' | 'regenerated' | 'edited' | 'corrected';

export class FeedbackRepository {
  async create(userId: string, eventType: FeedbackType, context?: Record<string, unknown>) {
    return prisma.feedbackEvent.create({
      data: { userId, eventType, context: (context as any) ?? undefined },
    });
  }
}
