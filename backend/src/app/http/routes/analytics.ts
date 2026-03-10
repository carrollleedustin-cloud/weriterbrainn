import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { container } from '../../../container';
import { AnalyticsService } from '../../../services/analytics/AnalyticsService';
import { requireUserId } from '../utils/user';
import { bindRequest } from '../../../infrastructure/observability/logger';

const FeedbackSchema = z.object({
  userId: z.string().min(1).optional(),
  eventType: z.enum(['accepted', 'regenerated', 'edited', 'corrected']),
  context: z.record(z.any()).optional(),
});

const UserSchema = z.object({ userId: z.string().min(1).optional() });
const SelectSchema = z.object({ userId: z.string().min(1).optional(), epsilon: z.number().min(0).max(1).optional() });
const RewardSchema = z.object({ userId: z.string().min(1).optional(), arm: z.enum(['baseline','rerank-heavy','recency-boost','importance-boost']), reward: z.number().min(-1).max(1) });

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  const analyticsService = container.resolve<AnalyticsService>('AnalyticsService');

  app.post('/api/analytics/feedback', async (req, reply) => {
    const parse = FeedbackSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });

    const userId = requireUserId(req, reply, parse.data.userId);
    if (!userId) return;
    const log = bindRequest(req);
    const out = await analyticsService.trackFeedback(userId, parse.data.eventType, parse.data.context);
    log.info({ userId, eventType: parse.data.eventType }, 'Analytics feedback recorded');
    return reply.code(202).send(out);
  });

  app.get('/api/analytics/strategy', async (req, reply) => {
    const parse = UserSchema.safeParse(req.query);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid query', details: parse.error.flatten() });
    const userId = requireUserId(req, reply, parse.data.userId);
    if (!userId) return;
    const log = bindRequest(req);
    const cur = await analyticsService.getStrategy(userId);
    log.info({ userId }, 'Analytics strategy fetched');
    return reply.send(cur);
  });

  app.post('/api/analytics/strategy/select', async (req, reply) => {
    const parse = SelectSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });
    const userId = requireUserId(req, reply, parse.data.userId);
    if (!userId) return;
    const log = bindRequest(req);
    const cur = await analyticsService.selectStrategy(userId, parse.data.epsilon ?? 0.2);
    log.info({ userId, epsilon: parse.data.epsilon }, 'Analytics strategy selected');
    return reply.send(cur);
  });

  app.post('/api/analytics/strategy/reward', async (req, reply) => {
    const parse = RewardSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });
    const userId = requireUserId(req, reply, parse.data.userId);
    if (!userId) return;
    const log = bindRequest(req);
    const out = await analyticsService.rewardStrategy(userId, parse.data.arm, parse.data.reward);
    log.info({ userId, arm: parse.data.arm, reward: parse.data.reward }, 'Analytics reward recorded');
    return reply.send(out);
  });
}
