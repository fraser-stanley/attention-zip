import { Redis } from "@upstash/redis";

export type RedisClient = Pick<Redis, "del" | "expire" | "get" | "incr" | "set">;

let redis: RedisClient | null = null;

export function isRedisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

export function getRedis(): RedisClient | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  if (redis) {
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}
