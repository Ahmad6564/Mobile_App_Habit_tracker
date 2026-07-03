import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedis } from "../config/redis";

// General API rate limiter: 100 requests / minute per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests" } },
  store: new RedisStore({
    sendCommand: (...args: [string, ...string[]]) => getRedis().call(...args) as Promise<number>,
    prefix: "rl:api:",
  }),
});

// Auth endpoints: 10 requests / 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many auth attempts, try again later" } },
  store: new RedisStore({
    sendCommand: (...args: [string, ...string[]]) => getRedis().call(...args) as Promise<number>,
    prefix: "rl:auth:",
  }),
});
