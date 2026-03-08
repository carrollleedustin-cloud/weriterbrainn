import { FeedbackService, FeedbackType } from './FeedbackService';
import { StrategyService, ArmName } from './StrategyService';

export class AnalyticsService {
  constructor(
    private feedbackService: FeedbackService,
    private strategyService: StrategyService
  ) {}

  async trackFeedback(userId: string, eventType: FeedbackType, context?: Record<string, unknown>) {
    await this.feedbackService.track(userId, eventType, context);
    return { status: 'recorded' as const };
  }

  async getStrategy(userId: string) {
    return this.strategyService.getCurrent(userId);
  }

  async selectStrategy(userId: string, epsilon = 0.2) {
    return this.strategyService.selectNext(userId, epsilon);
  }

  async rewardStrategy(userId: string, arm: ArmName, reward: number) {
    const ema = await this.strategyService.recordReward(userId, arm, reward);
    return { ema };
  }
}
