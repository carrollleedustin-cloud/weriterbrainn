/**
 * Redis client. Gracefully falls back when REDIS_URL is not set.
 */
import Redis from "ioredis";
import { config } from "../../config.js";

let client = null;

export function getRedis() {
  if (!config.redisUrl) return null;
  if (!client) {
    try {
      client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });
      client.on("error", () => {});
    } catch {
      return null;
    }
  }
  return client;
}

export async function redisGet(key) {
  const r = getRedis();
  if (!r) return null;
  try {
    const v = await r.get(key);
    return v != null ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export async function redisSet(key, value, ttlSeconds = 3600) {
  const r = getRedis();
  if (!r) return false;
  try {
    const str = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await r.setex(key, ttlSeconds, str);
    } else {
      await r.set(key, str);
    }
    return true;
  } catch {
    return false;
  }
}

export async function redisDel(key) {
  const r = getRedis();
  if (!r) return false;
  try {
    await r.del(key);
    return true;
  } catch {
    return false;
  }
}

export function isRedisAvailable() {
  return !!config.redisUrl;
}
