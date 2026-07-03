import { Router, Request, Response } from "express";
import Joi from "joi";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { sendSuccess } from "../utils/response";
import { MessageService } from "../services/message.service";

const router = Router();
const service = new MessageService();

router.use(authenticate);

const uid = (req: Request) => (req as any).user.id as string;
const page  = (req: Request) => Math.max(1, parseInt((req.query.page  as string) ?? "1",  10));
const limit = (req: Request) => Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "20", 10)));

const sendMessageSchema = Joi.object({
  text:      Joi.string().trim().max(2000).allow("").default(""),
  mediaUrl:  Joi.string().uri().allow(null, "").default(null),
  mediaType: Joi.string().valid("image", "video", "").default(""),
}).or("text", "mediaUrl");

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/messages/conversations?page=&limit=
 * List all conversations for the current user (inbox), newest first.
 */
router.get(
  "/conversations",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { conversations, total } = await service.getConversations(uid(req), p, l);
    sendSuccess(res, conversations, 200, undefined, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  })
);

/**
 * GET /api/messages/unread-count
 * Total number of conversations with unread messages.
 */
router.get(
  "/unread-count",
  asyncHandler(async (req: Request, res: Response) => {
    const count = await service.getUnreadCount(uid(req));
    sendSuccess(res, { count });
  })
);

/**
 * GET /api/messages/:conversationId?before=<messageId>&limit=
 * Load message history (cursor-based — pass ?before=<id> to load older messages).
 */
router.get(
  "/:conversationId",
  asyncHandler(async (req: Request, res: Response) => {
    const before = req.query.before as string | undefined;
    const l = limit(req);
    const { messages, hasMore } = await service.getMessages(
      uid(req),
      req.params.conversationId,
      before,
      l
    );
    sendSuccess(res, { messages, hasMore });
  })
);

/**
 * POST /api/messages/:username
 * Send a message to a user (creates conversation if it doesn't exist).
 * Body: { text?, mediaUrl?, mediaType? }
 */
router.post(
  "/:username",
  validate(sendMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { message, conversationId } = await service.sendMessage(
      uid(req),
      req.params.username,
      req.body
    );
    sendSuccess(res, { message, conversationId }, 201, "Message sent");
  })
);

/**
 * POST /api/messages/:conversationId/read
 * Mark a conversation as read by the current user.
 */
router.post(
  "/:conversationId/read",
  asyncHandler(async (req: Request, res: Response) => {
    await service.markAsRead(uid(req), req.params.conversationId);
    sendSuccess(res, null, 200, "Marked as read");
  })
);

export default router;
