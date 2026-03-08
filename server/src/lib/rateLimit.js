/**
 * Simple in-memory rate limiter.
 * For production, use redis-store with express-rate-limit.
 */
const windowMs = 60 * 1000; // 1 minute
const maxPerWindow = 100; // requests per minute per IP
const store = new Map();

function getKey(ip) {
  return ip || "unknown";
}

function cleanup() {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (now - data.resetTime > windowMs) {
      store.delete(key);
    }
  }
}

export function rateLimitMiddleware(options = {}) {
  const window = options.windowMs || windowMs;
  const max = options.max || maxPerWindow;

  setInterval(cleanup, 60000);

  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
    const key = getKey(ip);
    const now = Date.now();

    let data = store.get(key);
    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + window };
      store.set(key, data);
    }

    data.count += 1;

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - data.count));

    if (data.count > max) {
      return res.status(429).json({
        detail: "Too many requests. Please try again later.",
      });
    }
    next();
  };
}
