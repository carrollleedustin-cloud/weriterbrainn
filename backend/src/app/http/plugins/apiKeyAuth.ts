import { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../../../lib/config';

// Simple API key gate: if API_KEY is set, all routes except health must present it.
export async function apiKeyAuthHook(req: FastifyRequest, reply: FastifyReply) {
  if (!config.apiKey) return; // disabled when not configured

  // Allow health endpoints without auth
  if (req.url.startsWith('/health')) return;

  const headerKey =
    (req.headers['x-api-key'] as string | undefined) ||
    (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice('Bearer '.length)
      : undefined);

  if (!headerKey || headerKey !== config.apiKey) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}
