import pino from 'pino';
import { config } from '../../lib/config';

export const logger = pino({
  level: config.logLevel,
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      singleLine: true,
    },
  } : undefined,
});

export function withContext(base: Record<string, unknown>) {
  return logger.child(base);
}

export function bindRequest(req: { requestId?: string; userId?: string }) {
  const bindings: Record<string, unknown> = {};
  if (req.requestId) bindings.requestId = req.requestId;
  if (req.userId) bindings.userId = req.userId;
  return logger.child(bindings);
}
