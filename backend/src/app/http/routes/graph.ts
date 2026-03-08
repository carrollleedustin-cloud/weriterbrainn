import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { container } from '../../../container';
import { GraphService } from '../../../services/knowledge-graph/GraphService';

const NodesSchema = z.object({
  userId: z.string().min(1),
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
});

const EdgesSchema = z.object({
  userId: z.string().min(1),
  entityId: z.string().optional(),
  type: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
});

export async function registerGraphRoutes(app: FastifyInstance) {
  const graphService = container.resolve<GraphService>('GraphService');

  app.get('/api/graph/nodes', async (req, reply) => {
    const parse = NodesSchema.safeParse(req.query);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid query', details: parse.error.flatten() });
    const { userId, q, limit } = parse.data;
    const nodes = await graphService.getNodes({ userId, q, limit });
    return reply.send({ nodes });
  });

  app.get('/api/graph/edges', async (req, reply) => {
    const parse = EdgesSchema.safeParse(req.query);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid query', details: parse.error.flatten() });
    const { userId, entityId, type, limit } = parse.data;
    const edges = await graphService.getEdges({ userId, entityId, type, limit });
    return reply.send({ edges });
  });
}
