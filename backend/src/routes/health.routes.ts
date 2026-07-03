import { Router } from "express";
import { isDBConnected } from "../config/database";
import { isRedisAvailable, getRedis } from "../config/redis";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/health
router.get("/", async (_req, res) => {
  try {
    const mongoOk = isDBConnected();

    let redisOk = false;
    try {
      if (isRedisAvailable()) {
        const pong = await getRedis().ping();
        redisOk = pong === "PONG";
      }
    } catch {
      redisOk = false;
    }

    // Mongo is required; Redis is optional in development
    if (!mongoOk) {
      sendError(res, "Database unavailable", 503, "SERVICE_DEGRADED");
      return;
    }

    sendSuccess(res, {
      status: "ok",
      mongo: mongoOk ? "up" : "down",
      redis: redisOk ? "up" : "down",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    sendError(res, "Health check failed", 503);
  }
});

export default router;
