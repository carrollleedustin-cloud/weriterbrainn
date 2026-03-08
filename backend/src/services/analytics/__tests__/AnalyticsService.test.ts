import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../AnalyticsService';

describe('AnalyticsService', () => {
  it('tracks feedback via FeedbackService', async () => {
    const feedbackService = { track: vi.fn().mockResolvedValue(undefined) } as any;
    const strategyService = { getCurrent: vi.fn(), selectNext: vi.fn(), recordReward: vi.fn() } as any;
    const svc = new AnalyticsService(feedbackService, strategyService);

    const out = await svc.trackFeedback('user-1', 'accepted', { foo: 'bar' });

    expect(feedbackService.track).toHaveBeenCalledWith('user-1', 'accepted', { foo: 'bar' });
    expect(out).toEqual({ status: 'recorded' });
  });

  it('rewards strategy via StrategyService', async () => {
    const feedbackService = { track: vi.fn() } as any;
    const strategyService = { recordReward: vi.fn().mockResolvedValue(0.42), getCurrent: vi.fn(), selectNext: vi.fn() } as any;
    const svc = new AnalyticsService(feedbackService, strategyService);

    const out = await svc.rewardStrategy('user-1', 'baseline', 1);

    expect(strategyService.recordReward).toHaveBeenCalledWith('user-1', 'baseline', 1);
    expect(out).toEqual({ ema: 0.42 });
  });
});
