import fp from 'fastify-plugin';
import { randomUUID } from 'crypto';

// Adds a per-request id (trace id) for logging and downstream context.
export const requestContext = fp(async (app) => {
  app.addHook('onRequest', async (req) => {
    req.requestId = req.headers['x-request-id'] as string | undefined ?? randomUUID();
  });
});
