import { Router, Request, Response } from "express";
import Joi from "joi";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { sendSuccess } from "../utils/response";
import { NotificationService } from "../services/notification.service";

const router = Router();
const service = new NotificationService();

router.use(authenticate);

const uid = (req: Request) => (req as any).user.id as string;
const page  = (req: Request) => Math.max(1, parseInt((req.query.page  as string) ?? "1",  10));
const limit = (req: Request) => Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "20", 10)));

const settingsSchema = Joi.object({
  notifications: Joi.boolean(),
  reminderTime:  Joi.string().pattern(/^\d{2}:\d{2}$/),
}).min(1);

/**
 * GET /api/notifications?page=&limit=
 * Paginated list of notifications for the current user (newest first).
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { notifications, total } = await service.list(uid(req), p, l);
    sendSuccess(res, notifications, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

/**
 * GET /api/notifications/unread-count
 * Number of unread notifications.
 */
router.get(
  "/unread-count",
  asyncHandler(async (req: Request, res: Response) => {
    const count = await service.getUnreadCount(uid(req));
    sendSuccess(res, { count });
  })
);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read.
 */
router.patch(
  "/read-all",
  asyncHandler(async (req: Request, res: Response) => {
    await service.markAllRead(uid(req));
    sendSuccess(res, null, 200, "All notifications marked as read");
  })
);

/**
 * PATCH /api/notifications/settings
 * Update notification preferences (notifications on/off, reminderTime).
 */
router.patch(
  "/settings",
  validate(settingsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await service.updateSettings(uid(req), req.body);
    sendSuccess(res, null, 200, "Settings updated");
  })
);

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch(
  "/:id/read",
  asyncHandler(async (req: Request, res: Response) => {
    await service.markRead(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Notification marked as read");
  })
);

export default router;
