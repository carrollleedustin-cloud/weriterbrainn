import { Redis } from 'ioredis';
import { config } from '../../lib/config';
import { logger } from '../observability/logger';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});
