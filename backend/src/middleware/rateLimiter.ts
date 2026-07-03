import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedis, isRedisAvailable } from "../config/redis";

function getStore(prefix: string) {
  // Only use RedisStore if Redis is available; otherwise fall back to in-memory
  if (isRedisAvailable()) {
    return new RedisStore({
      sendCommand: (...args: [string, ...string[]]) => getRedis().call(...args) as Promise<number>,
      prefix,
    });
  }
  return undefined; // express-rate-limit uses MemoryStore by default
}

// General API rate limiter: 100 requests / minute per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests" } },
  store: getStore("rl:api:"),
});

// Auth endpoints: 10 requests / 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many auth attempts, try again later" } },
  store: getStore("rl:auth:"),
});
