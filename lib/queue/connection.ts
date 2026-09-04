import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

export function getRedisUrl() {
  return process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_URL ?? null;
}

export function getRedis(): IORedis | null {
  const url = getRedisUrl();
  if (!url) {
    return null;
  }
  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(url, {
      maxRetriesPerRequest: null,
    });
  }
  return globalForRedis.redis;
}
