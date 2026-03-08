import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { container } from '../../../container';
import { RagService } from '../../../services/ai/RagService';

const RetrieveSchema = z.object({
  userId: z.string().min(1),
  q: z.string().min(1),
  k: z.coerce.number().min(1).max(100).optional(),
  filters: z.object({
    types: z.array(z.enum(['EPISODIC', 'SEMANTIC', 'PROJECT', 'GOAL', 'BELIEF'])).optional(),
    tiers: z.array(z.enum(['SHORT_TERM', 'LONG_TERM'])).optional(),
    tags: z.array(z.string()).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    minImportance: z.number().min(0).max(1).optional(),
  }).optional(),
  weights: z.object({
    vector: z.number().min(0).max(1).optional(),
    fts: z.number().min(0).max(1).optional(),
    importance: z.number().min(0).max(1).optional(),
    recency: z.number().min(0).max(1).optional(),
    tierBoost: z.number().min(0).max(1).optional(),
  }).optional(),
  decay: z.object({ halfLifeDays: z.number().min(1).max(365).optional() }).optional(),
  rerank: z.boolean().optional(),
  rerankBlend: z.number().min(0).max(1).optional(),
  tokenBudget: z.number().min(128).max(4096).optional(),
  llmRewrite: z.boolean().optional(),
  maxVariants: z.number().min(1).max(10).optional(),
  variantStrategy: z.enum(['merge', 'best']).optional(),
});

export async function registerChatRoutes(app: FastifyInstance) {
  const rag = container.resolve<RagService>('RagService');

  app.post('/api/chat/retrieve', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = RetrieveSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });
    }
    const out = await rag.retrieve(parse.data);
    return reply.send(out);
  });
}
