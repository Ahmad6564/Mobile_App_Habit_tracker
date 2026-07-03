import { Router } from "express";
import { isDBConnected } from "../config/database";
import { getRedis } from "../config/redis";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/health
router.get("/", async (_req, res) => {
  try {
    const mongoOk = isDBConnected();

    let redisOk = false;
    try {
      const pong = await getRedis().ping();
      redisOk = pong === "PONG";
    } catch {
      redisOk = false;
    }

    const allOk = mongoOk && redisOk;

    if (!allOk) {
      sendError(res, "One or more services degraded", 503, "SERVICE_DEGRADED");
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
