import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/response";
import { AnalyticsService } from "../services/analytics.service";
import { Errors } from "../utils/AppError";

const router = Router();
const service = new AnalyticsService();

router.use(authenticate);

// ── Calendar ──────────────────────────────────────────────────────────────────

/**
 * GET /api/calendar/:year/:month
 * Per-day habit completion % and task counts for a given month.
 * month is 1-indexed (1 = January, 12 = December).
 */
router.get(
  "/calendar/:year/:month",
  asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    if (isNaN(year) || year < 2020 || year > 2100)
      throw Errors.badRequest("Invalid year");
    if (isNaN(month) || month < 1 || month > 12)
      throw Errors.badRequest("month must be 1–12");

    const data = await service.getCalendarMonth(
      (req as any).user.id,
      year,
      month
    );
    sendSuccess(res, data);
  })
);

// ── Analytics ─────────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/weekly
 * Review stats for the current Mon→Sun week.
 */
router.get(
  "/analytics/weekly",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await service.getWeeklyReview((req as any).user.id);
    sendSuccess(res, data);
  })
);

/**
 * GET /api/analytics/monthly/:year/:month
 * Detailed monthly report (month is 1-indexed).
 */
router.get(
  "/analytics/monthly/:year/:month",
  asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    if (isNaN(year) || year < 2020 || year > 2100)
      throw Errors.badRequest("Invalid year");
    if (isNaN(month) || month < 1 || month > 12)
      throw Errors.badRequest("month must be 1–12");

    const data = await service.getMonthlyReport(
      (req as any).user.id,
      year,
      month
    );
    sendSuccess(res, data);
  })
);

/**
 * GET /api/analytics/streaks
 * Current & longest streak for all active habits.
 */
router.get(
  "/analytics/streaks",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await service.getAllStreaks((req as any).user.id);
    sendSuccess(res, data);
  })
);

export default router;
