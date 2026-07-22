/**
 * Eenvoudige rate limiter. Gebruikt Redis wanneer REDIS_URL beschikbaar is,
 * anders een in-memory fallback (voldoende voor één instance / dev).
 */
import { getRedis } from "@/lib/redis";

const memory = new Map<string, { count: number; reset: number }>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  key: string,
  limit = 10,
  windowSec = 60,
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();
  const reset = now + windowSec * 1000;

  if (redis) {
    const redisKey = `rl:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSec);
    return { success: count <= limit, remaining: Math.max(0, limit - count), reset };
  }

  // in-memory fallback
  const entry = memory.get(key);
  if (!entry || entry.reset < now) {
    memory.set(key, { count: 1, reset });
    return { success: true, remaining: limit - 1, reset };
  }
  entry.count += 1;
  return { success: entry.count <= limit, remaining: Math.max(0, limit - entry.count), reset: entry.reset };
}
