import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { container } from '../../../container';
import { MemoryService } from '../../../services/memory/MemoryService';
import { requireUserId } from '../utils/user';
import { bindRequest } from '../../../infrastructure/observability/logger';

const CreateMemorySchema = z.object({
  userId: z.string().min(1).optional(),
  type: z.enum(['EPISODIC', 'SEMANTIC', 'PROJECT', 'GOAL', 'BELIEF']),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const SearchSchema = z.object({
  userId: z.string().min(1).optional(),
  q: z.string().optional(),
  k: z.coerce.number().min(1).max(100).optional(),
  tiers: z.array(z.enum(['SHORT_TERM', 'LONG_TERM'])).optional(),
});

export async function registerMemoryRoutes(app: FastifyInstance) {
  const memoryService = container.resolve<MemoryService>('MemoryService');

  app.post('/api/memory', async (req, reply) => {
    const parse = CreateMemorySchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });
    }
    const userId = requireUserId(req, reply, parse.data.userId);
    if (!userId) return;
    const log = bindRequest(req);
    const mem = await memoryService.createMemory({ ...parse.data, userId });
    log.info({ memoryId: mem.id, userId, type: parse.data.type }, 'Memory accepted for processing');
    return reply.code(202).send({ id: mem.id, status: 'queued' });
  });

  app.get('/api/memory/search', async (req, reply) => {
    const parse = SearchSchema.safeParse(req.query);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Invalid query', details: parse.error.flatten() });
    }
    const userId = requireUserId(req, reply, parse.data.userId);
    if (!userId) return;
    const { q, k, tiers } = parse.data;
    const log = bindRequest(req);
    const out = await memoryService.searchMemories({
      userId,
      q,
      k,
      filters: tiers ? { tiers } : undefined,
      weights: { vector: 0.6, fts: 0.4 },
    });
    log.info({ userId, q, returned: out.results?.length ?? 0 }, 'Memory search served');
    return reply.send(out);
  });
}
