import { FastifyReply, FastifyRequest } from 'fastify';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../../../lib/config';

function base64UrlToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.length % 4 === 0 ? normalized : normalized.padEnd(normalized.length + (4 - (normalized.length % 4)), '=');
  return Buffer.from(padded, 'base64');
}

function verifyJwtHs256(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = createHmac('sha256', secret).update(data).digest();
  const received = base64UrlToBuffer(signature);
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;
  try {
    const decoded = base64UrlToBuffer(payload).toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function authHook(req: FastifyRequest, reply: FastifyReply) {
  if (!config.jwtSecret) return; // disabled when not configured

  // Allow health without auth
  if (req.url.startsWith('/health')) return;

  // If API key header already present (validated by previous hook), skip JWT enforcement
  const headerKey =
    (req.headers['x-api-key'] as string | undefined) ||
    (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice('Bearer '.length)
      : undefined);
  if (config.apiKey && headerKey === config.apiKey) {
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const token = authHeader.slice('Bearer '.length);
  const payload = verifyJwtHs256(token, config.jwtSecret);
  if (!payload) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  // Basic exp/nbf validation if present (seconds since epoch)
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = typeof payload['exp'] === 'number' ? payload['exp'] : undefined;
  const nbf = typeof payload['nbf'] === 'number' ? payload['nbf'] : undefined;
  if ((typeof exp === 'number' && nowSec >= exp) || (typeof nbf === 'number' && nowSec < nbf)) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const maybeUser = (payload['sub'] as string) || (payload['userId'] as string);
  if (maybeUser) {
    req.userId = maybeUser;
  }
  req.authPayload = payload;
}
