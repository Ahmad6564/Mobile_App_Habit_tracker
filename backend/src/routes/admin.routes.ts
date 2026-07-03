import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/response";
import { adminService } from "../services/admin.service";
import { ReportStatus } from "../models/Report";
import {
  submitReportSchema,
  reviewReportSchema,
  suspendUserSchema,
  banUserSchema,
  adminPaginationSchema,
} from "../validators/admin.validators";

const router = Router();

// ─── User-facing: Submit Report ──────────────────────────────────────────────

router.post(
  "/reports",
  authenticate,
  validate(submitReportSchema),
  asyncHandler(async (req, res) => {
    const report = await adminService.submitReport(req.user!._id.toString(), req.body);
    sendSuccess(res, report, 201, "Report submitted");
  })
);

// ─── Admin-only endpoints ────────────────────────────────────────────────────

router.get(
  "/admin/reports",
  authenticate,
  requireRole("admin", "moderator"),
  validate(adminPaginationSchema, "query"),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = (req.query.status as ReportStatus | "all") || "pending";
    const { reports, total } = await adminService.listReports(status, page, limit);
    sendSuccess(res, reports, 200, undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
  })
);

router.patch(
  "/admin/reports/:reportId",
  authenticate,
  requireRole("admin", "moderator"),
  validate(reviewReportSchema),
  asyncHandler(async (req, res) => {
    const report = await adminService.reviewReport(
      req.user!._id.toString(),
      req.params.reportId,
      req.body
    );
    sendSuccess(res, report);
  })
);

// ─── User Moderation ─────────────────────────────────────────────────────────

router.post(
  "/admin/users/:userId/suspend",
  authenticate,
  requireRole("admin"),
  validate(suspendUserSchema),
  asyncHandler(async (req, res) => {
    await adminService.suspendUser(
      req.user!._id.toString(),
      req.params.userId,
      req.body.days,
      req.body.reason
    );
    sendSuccess(res, null, 200, "User suspended");
  })
);

router.post(
  "/admin/users/:userId/unsuspend",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    await adminService.unsuspendUser(req.user!._id.toString(), req.params.userId);
    sendSuccess(res, null, 200, "User unsuspended");
  })
);

router.post(
  "/admin/users/:userId/ban",
  authenticate,
  requireRole("admin"),
  validate(banUserSchema),
  asyncHandler(async (req, res) => {
    await adminService.banUser(
      req.user!._id.toString(),
      req.params.userId,
      req.body.reason
    );
    sendSuccess(res, null, 200, "User banned");
  })
);

router.post(
  "/admin/users/:userId/unban",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    await adminService.unbanUser(req.user!._id.toString(), req.params.userId);
    sendSuccess(res, null, 200, "User unbanned");
  })
);

// ─── Content Removal ─────────────────────────────────────────────────────────

router.delete(
  "/admin/posts/:postId",
  authenticate,
  requireRole("admin", "moderator"),
  asyncHandler(async (req, res) => {
    await adminService.removePost(req.user!._id.toString(), req.params.postId);
    sendSuccess(res, null, 200, "Post removed");
  })
);

router.delete(
  "/admin/journeys/:journeyId",
  authenticate,
  requireRole("admin", "moderator"),
  asyncHandler(async (req, res) => {
    await adminService.removeJourney(req.user!._id.toString(), req.params.journeyId);
    sendSuccess(res, null, 200, "Journey removed");
  })
);

// ─── Platform Analytics ──────────────────────────────────────────────────────

router.get(
  "/admin/analytics",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const analytics = await adminService.getAnalytics();
    sendSuccess(res, analytics);
  })
);

// ─── Admin Logs ──────────────────────────────────────────────────────────────

router.get(
  "/admin/logs",
  authenticate,
  requireRole("admin"),
  validate(adminPaginationSchema, "query"),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { logs, total } = await adminService.getLogs(page, limit);
    sendSuccess(res, logs, 200, undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
  })
);

export default router;
