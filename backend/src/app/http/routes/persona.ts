import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { container } from '../../../container';
import { PersonaService } from '../../../services/persona/PersonaService';

const QuerySchema = z.object({ userId: z.string().min(1) });
const UpdateSchema = z.object({ userId: z.string().min(1) });

export async function registerPersonaRoutes(app: FastifyInstance) {
  const persona = container.resolve<PersonaService>('PersonaService');

  app.get('/api/persona/profile', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = QuerySchema.safeParse(req.query);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid query', details: parse.error.flatten() });
    const metrics = await persona.getProfile(parse.data.userId);
    return reply.send({ profile: metrics });
  });

  app.post('/api/persona/profile/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = UpdateSchema.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: 'Invalid payload', details: parse.error.flatten() });
    const metrics = await persona.updateProfile(parse.data.userId);
    return reply.send({ profile: metrics });
  });
}
