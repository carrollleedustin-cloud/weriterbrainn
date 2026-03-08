import { prisma } from '../../infrastructure/db/PrismaClient';

export type FeedbackType = 'accepted' | 'regenerated' | 'edited' | 'corrected';

export class FeedbackService {
  async track(userId: string, eventType: FeedbackType, context?: Record<string, unknown>) {
    await prisma.feedbackEvent.create({ data: { userId, eventType, context: (context as any) ?? undefined } });
  }
}
