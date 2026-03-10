import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    authPayload?: Record<string, unknown>;
    requestId?: string;
  }
}
