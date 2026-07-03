import { Router, Request, Response } from "express";
import Joi from "joi";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { sendSuccess } from "../utils/response";
import { CoachService } from "../services/coach.service";

const router = Router();
const service = new CoachService();

router.use(authenticate);

const uid = (req: Request) => (req as any).user.id as string;

const sendMessageSchema = Joi.object({
  text: Joi.string().trim().min(1).max(2000).required(),
});

/**
 * GET /api/coach/chats
 * List all coach chat sessions (title + timestamps only).
 */
router.get(
  "/chats",
  asyncHandler(async (req: Request, res: Response) => {
    const chats = await service.listChats(uid(req));
    sendSuccess(res, chats);
  })
);

/**
 * POST /api/coach/chats
 * Create a new empty coach chat session.
 */
router.post(
  "/chats",
  asyncHandler(async (req: Request, res: Response) => {
    const chat = await service.createChat(uid(req));
    sendSuccess(res, chat, 201, "Chat created");
  })
);

/**
 * GET /api/coach/chats/:id
 * Get a specific chat with full message history.
 */
router.get(
  "/chats/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const chat = await service.getChat(uid(req), req.params.id);
    sendSuccess(res, chat);
  })
);

/**
 * DELETE /api/coach/chats/:id
 * Delete a coach chat session.
 */
router.delete(
  "/chats/:id",
  asyncHandler(async (req: Request, res: Response) => {
    await service.deleteChat(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Chat deleted");
  })
);

/**
 * POST /api/coach/chats/:id/messages
 * Send a message and receive an AI reply.
 * Rate limited: 50 messages per day per user.
 */
router.post(
  "/chats/:id/messages",
  validate(sendMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { reply, chat } = await service.sendMessage(uid(req), req.params.id, req.body.text);
    sendSuccess(res, { reply, chatId: chat._id, title: chat.title });
  })
);

export default router;
