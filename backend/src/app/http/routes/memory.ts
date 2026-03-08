import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { container } from '../../../container';
import { MemoryService } from '../../../services/memory/MemoryService';

const CreateMemorySchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['EPISODIC', 'SEMANTIC', 'PROJECT', 'GOAL', 'BELIEF']),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const SearchSchema = z.object({
  userId: z.string().min(1),
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
    const mem = await memoryService.createMemory(parse.data);
    return reply.code(202).send({ id: mem.id, status: 'queued' });
  });

  app.get('/api/memory/search', async (req, reply) => {
    const parse = SearchSchema.safeParse(req.query);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Invalid query', details: parse.error.flatten() });
    }
    const { userId, q, k, tiers } = parse.data;
    const out = await memoryService.searchMemories({
      userId,
      q,
      k,
      filters: tiers ? { tiers } : undefined,
      weights: { vector: 0.6, fts: 0.4 },
    });
    return reply.send(out);
  });
}
