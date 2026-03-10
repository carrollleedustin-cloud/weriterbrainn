import { FastifyRequest } from 'fastify';
import { FastifyReply } from 'fastify';

// Resolve userId from authenticated request context with optional fallback from payload/query.
// Returns null when neither is present so route handlers can respond with 401.
export function resolveUserId(req: FastifyRequest, fallback?: string): string | null {
  return req.userId ?? fallback ?? null;
}

// Resolve userId and send a 401 if not available. Returns the userId or null when response sent.
export function requireUserId(req: FastifyRequest, reply: FastifyReply, fallback?: string): string | null {
  const userId = resolveUserId(req, fallback);
  if (!userId) {
    reply.code(401).send({ error: 'Unauthorized' });
    return null;
  }
  return userId;
}
