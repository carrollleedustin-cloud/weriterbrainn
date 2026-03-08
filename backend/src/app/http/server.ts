import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import { config } from '../../lib/config';
import { logger } from '../../infrastructure/observability/logger';
import { bootstrapContainer } from '../containerBootstrap';

export function buildServer() {
  const app = Fastify({ logger });

  bootstrapContainer();

  app.register(sensible);
  app.register(fastifyCors, { origin: true, credentials: true });
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  app.get('/health', async () => ({ status: 'ok' }));
  
  // Routes
  app.register(async (scope) => {
  const { registerMemoryRoutes } = await import('./routes/memory');
  await registerMemoryRoutes(scope);
  });
  
  app.register(async (scope) => {
  const { registerChatRoutes } = await import('./routes/chat');
  await registerChatRoutes(scope);
  });
  
  app.register(async (scope) => {
  const { registerGraphRoutes } = await import('./routes/graph');
  await registerGraphRoutes(scope);
  });
  
  app.register(async (scope) => {
  const { registerPersonaRoutes } = await import('./routes/persona');
  await registerPersonaRoutes(scope);
  });
  
  app.register(async (scope) => {
  const { registerAnalyticsRoutes } = await import('./routes/analytics');
  await registerAnalyticsRoutes(scope);
  });
  
  return app;
  }

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildServer();
  app.listen({ port: config.port, host: '0.0.0.0' })
    .then((address) => {
      logger.info({ address }, 'HTTP server listening');
    })
    .catch((err) => {
      logger.error(err, 'Failed to start server');
      process.exit(1);
    });
}
