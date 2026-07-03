import "./config/env"; // validate env vars first — will throw on bad config
import http from "http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";

import { connectDB, disconnectDB } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import { setupSocket } from "./services/socket.service";
import { initFirebase } from "./config/firebase";
import { ReminderJobs } from "./jobs/reminders";
import cron from "node-cron";

import authRoutes      from "./routes/auth.routes";
import userRoutes      from "./routes/user.routes";
import habitRoutes     from "./routes/habit.routes";
import taskRoutes      from "./routes/task.routes";
import healthRoutes    from "./routes/health.routes";
import analyticsRoutes from "./routes/analytics.routes";
import communityRoutes from "./routes/community.routes";
import postRoutes      from "./routes/post.routes";
import mediaRoutes     from "./routes/media.routes";
import messageRoutes   from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";
import coachRoutes     from "./routes/coach.routes";

const app = express();

// ─── Security & transport middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
}));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(env.isDev ? "dev" : "combined", {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ─── Global rate limiter ───────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/health",    healthRoutes);
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/habits",    habitRoutes);
app.use("/api/tasks",     taskRoutes);
app.use("/api",           analyticsRoutes);   // /api/calendar/:y/:m  +  /api/analytics/*
app.use("/api/community", communityRoutes);
app.use("/api/posts",         postRoutes);
app.use("/api/media",         mediaRoutes);
app.use("/api/messages",      messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/coach",         coachRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();
  await connectRedis();
  initFirebase();

  const httpServer = http.createServer(app);
  setupSocket(httpServer);

  // ─── Cron jobs ─────────────────────────────────────────────────────────────
  const jobs = new ReminderJobs();
  // Every hour: send habit reminders to users whose reminder time matches
  cron.schedule("0 * * * *", () => jobs.sendHabitReminders());
  // Every day at 08:00 UTC: send task due reminders
  cron.schedule("0 8 * * *", () => jobs.sendTaskDueReminders());

  const server = httpServer.listen(env.port, () => {
    logger.info(`HabitForge API running on port ${env.port} [${env.nodeEnv}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      logger.info("Server closed");
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { err });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { reason });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error("Bootstrap failed", { err });
  process.exit(1);
});

export default app;
