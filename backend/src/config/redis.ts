import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

let redisClient: Redis | null = null;
let redisAvailable = false;

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on("connect", () => { redisAvailable = true; logger.info("Redis connected"); });
    redisClient.on("error", (err) => logger.error("Redis error", { err }));
    redisClient.on("close", () => { redisAvailable = false; logger.warn("Redis connection closed"); });
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    await getRedis().connect();
    redisAvailable = true;
  } catch (err) {
    redisAvailable = false;
    logger.warn("Redis unavailable — running without Redis (rate limiting & token blacklist disabled)");
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisAvailable) {
    await redisClient.quit();
  }
  redisClient = null;
  redisAvailable = false;
  logger.info("Redis disconnected gracefully");
}
