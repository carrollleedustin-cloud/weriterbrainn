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
