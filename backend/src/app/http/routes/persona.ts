import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { container } from '../../../container';
import { PersonaService } from '../../../services/persona/PersonaService';
import { requireUserId } from '../utils/user';
import { bindRequest } from '../../../infrastructure/observability/logger';

const QuerySchema = z.object({ userId: z.string().min(1).optional() });
const UpdateSchema = z.object({ userId: z.string().min(1).optional() });

export async function registerPersonaRoutes(app: FastifyInstance) {
  const persona = container.resolve<PersonaService>('PersonaService');

  app.get('/api/persona/profile', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = QuerySchema.safeParse(req.query);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid query', details: parse.error.flatten() });
    const userId = requireUserId(req, reply, parse.data.userId);
    if (!userId) return;
    const log = bindRequest(req);
    const metrics = await persona.getProfile(userId);
    log.info({ userId }, 'Persona profile fetched');
    return reply.send({ profile: metrics });
  });

  app.post('/api/persona/profile/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = UpdateSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });
    const userId = requireUserId(req, reply, parse.data.userId);
    if (!userId) return;
    const log = bindRequest(req);
    const metrics = await persona.updateProfile(userId);
    log.info({ userId }, 'Persona profile refreshed');
    return reply.send({ profile: metrics });
  });
}
