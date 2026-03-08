/**
 * Request-scoped context for RLS (app.user_id).
 * Used by db.query to SET app.user_id before each query.
 */
import { AsyncLocalStorage } from "async_hooks";

export const requestContext = new AsyncLocalStorage();

/**
 * Run handler with userId in context. Call from middleware after auth.
 */
export function runWithContext(userId, fn) {
  return requestContext.run({ userId: userId ?? null }, fn);
}

/**
 * Get current request's userId (from JWT). Null for unauthenticated.
 */
export function getRequestUserId() {
  const store = requestContext.getStore();
  return store?.userId ?? null;
}
