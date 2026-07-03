import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { sendSuccess } from "../utils/response";
import { HabitService } from "../services/habit.service";
import {
  createHabitSchema,
  updateHabitSchema,
  logHabitSchema,
  logsQuerySchema,
  matrixQuerySchema,
} from "../validators/habit.validators";

const router = Router();
const service = new HabitService();

// All habit routes require authentication
router.use(authenticate);

// ── Static / collection routes (must come BEFORE /:id) ───────────────────────

/**
 * GET /api/habits/presets
 * Return a curated list of habit templates.
 */
router.get(
  "/presets",
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, service.getPresets());
  })
);

/**
 * GET /api/habits/summary
 * Dashboard quick-stats (today's progress, month avg, top streaks).
 */
router.get(
  "/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await service.getDashboardSummary((req as any).user.id);
    sendSuccess(res, data);
  })
);

/**
 * GET /api/habits/matrix?year=&month=
 * Month grid for all active habits (0-indexed month, matching JS Date).
 */
router.get(
  "/matrix",
  validate(matrixQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { year, month } = req.query as unknown as { year: number; month: number };
    const data = await service.getMatrix((req as any).user.id, Number(year), Number(month));
    sendSuccess(res, data);
  })
);

/**
 * GET /api/habits/archived
 * List archived habits.
 */
router.get(
  "/archived",
  asyncHandler(async (req: Request, res: Response) => {
    const habits = await service.listArchivedHabits((req as any).user.id);
    sendSuccess(res, habits);
  })
);

// ── Collection ────────────────────────────────────────────────────────────────

/**
 * GET /api/habits
 * List all active habits with current streak data.
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const habits = await service.listHabits((req as any).user.id);
    sendSuccess(res, habits);
  })
);

/**
 * POST /api/habits
 * Create a new habit.
 */
router.post(
  "/",
  validate(createHabitSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const habit = await service.createHabit((req as any).user.id, req.body);
    sendSuccess(res, habit, 201);
  })
);

// ── Single-resource routes ────────────────────────────────────────────────────

/**
 * GET /api/habits/:id
 * Get a single habit with streak.
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const habit = await service.getHabit((req as any).user.id, req.params.id);
    sendSuccess(res, habit);
  })
);

/**
 * PATCH /api/habits/:id
 * Update habit fields.
 */
router.patch(
  "/:id",
  validate(updateHabitSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const habit = await service.updateHabit((req as any).user.id, req.params.id, req.body);
    sendSuccess(res, habit);
  })
);

/**
 * DELETE /api/habits/:id
 * Archive (soft-delete) a habit.
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    await service.archiveHabit((req as any).user.id, req.params.id);
    sendSuccess(res, null, 200, "Habit archived");
  })
);

/**
 * POST /api/habits/:id/restore
 * Restore an archived habit.
 */
router.post(
  "/:id/restore",
  asyncHandler(async (req: Request, res: Response) => {
    const habit = await service.restoreHabit((req as any).user.id, req.params.id);
    sendSuccess(res, habit);
  })
);

// ── Logging ───────────────────────────────────────────────────────────────────

/**
 * POST /api/habits/:id/log
 * Log a habit completion for a given date.
 */
router.post(
  "/:id/log",
  validate(logHabitSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.logHabit((req as any).user.id, req.params.id, req.body);
    sendSuccess(res, result, 201);
  })
);

/**
 * DELETE /api/habits/:id/log/:date
 * Remove a specific log entry (date = "YYYY-MM-DD").
 */
router.delete(
  "/:id/log/:date",
  asyncHandler(async (req: Request, res: Response) => {
    const streak = await service.removeLog(
      (req as any).user.id,
      req.params.id,
      req.params.date
    );
    sendSuccess(res, streak);
  })
);

/**
 * GET /api/habits/:id/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Fetch logs in a date range.
 */
router.get(
  "/:id/logs",
  validate(logsQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as { from: string; to: string };
    const logs = await service.getLogs((req as any).user.id, req.params.id, from, to);
    sendSuccess(res, logs);
  })
);

// ── Analytics ─────────────────────────────────────────────────────────────────

/**
 * GET /api/habits/:id/analytics
 * 90-day analytics: weekly breakdown, heatmap, streak stats.
 */
router.get(
  "/:id/analytics",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await service.getAnalytics((req as any).user.id, req.params.id);
    sendSuccess(res, data);
  })
);

// ── Streak Shield ─────────────────────────────────────────────────────────────

/**
 * POST /api/habits/:id/shield
 * Use the streak shield to protect today's streak (30-day cooldown).
 */
router.post(
  "/:id/shield",
  asyncHandler(async (req: Request, res: Response) => {
    const streak = await service.useStreakShield((req as any).user.id, req.params.id);
    sendSuccess(res, streak);
  })
);

export default router;
