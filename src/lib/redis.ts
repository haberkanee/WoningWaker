import IORedis, { type Redis } from "ioredis";

/**
 * Redis-verbinding voor rate limiting en BullMQ. Optioneel: zonder REDIS_URL
 * geven we `null` terug en degraderen features netjes.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis | null };

export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRedis.redis = null;
    return null;
  }
  try {
    const client = new IORedis(url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    client.on("error", () => {
      /* stil: degradeer naar mock zonder de app te breken */
    });
    globalForRedis.redis = client;
    return client;
  } catch {
    globalForRedis.redis = null;
    return null;
  }
}
