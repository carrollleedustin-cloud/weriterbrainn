import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { container } from '../../../container';
import { AnalyticsService } from '../../../services/analytics/AnalyticsService';

const FeedbackSchema = z.object({
  userId: z.string().min(1),
  eventType: z.enum(['accepted', 'regenerated', 'edited', 'corrected']),
  context: z.record(z.any()).optional(),
});

const UserSchema = z.object({ userId: z.string().min(1) });
const SelectSchema = z.object({ userId: z.string().min(1), epsilon: z.number().min(0).max(1).optional() });
const RewardSchema = z.object({ userId: z.string().min(1), arm: z.enum(['baseline','rerank-heavy','recency-boost','importance-boost']), reward: z.number().min(-1).max(1) });

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  const analyticsService = container.resolve<AnalyticsService>('AnalyticsService');

  app.post('/api/analytics/feedback', async (req, reply) => {
    const parse = FeedbackSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });

    const out = await analyticsService.trackFeedback(parse.data.userId, parse.data.eventType, parse.data.context);
    return reply.code(202).send(out);
  });

  app.get('/api/analytics/strategy', async (req, reply) => {
    const parse = UserSchema.safeParse(req.query);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid query', details: parse.error.flatten() });
    const cur = await analyticsService.getStrategy(parse.data.userId);
    return reply.send(cur);
  });

  app.post('/api/analytics/strategy/select', async (req, reply) => {
    const parse = SelectSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });
    const cur = await analyticsService.selectStrategy(parse.data.userId, parse.data.epsilon ?? 0.2);
    return reply.send(cur);
  });

  app.post('/api/analytics/strategy/reward', async (req, reply) => {
    const parse = RewardSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });
    const out = await analyticsService.rewardStrategy(parse.data.userId, parse.data.arm, parse.data.reward);
    return reply.send(out);
  });
}
