import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on("connect",    () => logger.info("Redis connected"));
    redisClient.on("error", (err)  => logger.error("Redis error", { err }));
    redisClient.on("close",      () => logger.warn("Redis connection closed"));
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  await getRedis().connect();
}

export async function disconnectRedis(): Promise<void> {
  await getRedis().quit();
  redisClient = null;
  logger.info("Redis disconnected gracefully");
}
