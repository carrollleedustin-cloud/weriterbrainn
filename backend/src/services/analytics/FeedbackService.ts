import { FeedbackRepository, FeedbackType } from '../../infrastructure/repositories/FeedbackRepository';

export { FeedbackType } from '../../infrastructure/repositories/FeedbackRepository';

export class FeedbackService {
  constructor(private repo: FeedbackRepository) {}

  async track(userId: string, eventType: FeedbackType, context?: Record<string, unknown>) {
    await this.repo.create(userId, eventType, context);
  }
}
