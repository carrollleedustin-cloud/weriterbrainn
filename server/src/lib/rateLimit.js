/**
 * Rate limiter. Uses Redis when available, else in-memory store.
 */
import { getRedis, isRedisAvailable } from "./redis.js";

const windowMs = 60 * 1000;
const maxPerWindow = 100;
const memStore = new Map();

function getKey(ip) {
  return `ratelimit:${ip || "unknown"}`;
}

function memCleanup() {
  const now = Date.now();
  for (const [key, data] of memStore.entries()) {
    if (now - data.resetTime > windowMs) memStore.delete(key);
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(memCleanup, 60000);
}

async function redisIncr(key, window) {
  const r = getRedis();
  if (!r) return null;
  const multi = r.multi();
  multi.incr(key);
  multi.pttl(key);
  const result = await multi.exec();
  if (!result) return null;
  const [incrRes, ttlRes] = result;
  const count = incrRes[1];
  if (ttlRes[1] === -1) await r.pexpire(key, window);
  return count;
}

export function rateLimitMiddleware(options = {}) {
  const window = options.windowMs || windowMs;
  const max = options.max || maxPerWindow;
  const useRedis = isRedisAvailable();

  return async (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
    const key = getKey(ip);

    let count;
    if (useRedis) {
      try {
        const c = await redisIncr(key, window);
        count = c ?? 0;
      } catch {
        count = 1;
      }
    } else {
      const now = Date.now();
      let data = memStore.get(key);
      if (!data || now > data.resetTime) {
        data = { count: 0, resetTime: now + window };
        memStore.set(key, data);
      }
      data.count += 1;
      count = data.count;
    }

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));

    if (count > max) {
      return res.status(429).json({
        detail: "Too many requests. Please try again later.",
      });
    }
    next();
  };
}
