import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/response";
import { nutritionService } from "../services/nutrition.service";
import {
  analyzeSchema,
  correctSchema,
  nutritionChatMessageSchema,
  dateRangeSchema,
  dailyLogSchema,
} from "../validators/nutrition.validators";

const router = Router();
router.use(authenticate);

// ─── Image Analysis ──────────────────────────────────────────────────────────

router.post(
  "/analyze",
  validate(analyzeSchema),
  asyncHandler(async (req, res) => {
    const analysis = await nutritionService.analyze(
      req.user!._id.toString(),
      req.body.imageUrl,
      req.body.mealType,
      req.body.date
    );
    sendSuccess(res, analysis, 201, "Meal analyzed successfully");
  })
);

// ─── Daily Log ───────────────────────────────────────────────────────────────

router.get(
  "/daily",
  validate(dailyLogSchema, "query"),
  asyncHandler(async (req, res) => {
    const logs = await nutritionService.getDailyLog(
      req.user!._id.toString(),
      req.query.date as string
    );
    sendSuccess(res, logs);
  })
);

// ─── Date Range ──────────────────────────────────────────────────────────────

router.get(
  "/range",
  validate(dateRangeSchema, "query"),
  asyncHandler(async (req, res) => {
    const logs = await nutritionService.getDateRange(
      req.user!._id.toString(),
      req.query.startDate as string,
      req.query.endDate as string
    );
    sendSuccess(res, logs);
  })
);

// ─── Weekly Report ───────────────────────────────────────────────────────────

router.get(
  "/report",
  validate(dateRangeSchema, "query"),
  asyncHandler(async (req, res) => {
    const report = await nutritionService.getWeeklyReport(
      req.user!._id.toString(),
      req.query.startDate as string,
      req.query.endDate as string
    );
    sendSuccess(res, report);
  })
);

// ─── Correct Analysis ────────────────────────────────────────────────────────

router.patch(
  "/:analysisId/correct",
  validate(correctSchema),
  asyncHandler(async (req, res) => {
    const analysis = await nutritionService.correct(
      req.user!._id.toString(),
      req.params.analysisId,
      req.body.correctedResult
    );
    sendSuccess(res, analysis);
  })
);

// ─── Delete Analysis ─────────────────────────────────────────────────────────

router.delete(
  "/:analysisId",
  asyncHandler(async (req, res) => {
    await nutritionService.deleteAnalysis(
      req.user!._id.toString(),
      req.params.analysisId
    );
    sendSuccess(res, null, 200, "Analysis deleted");
  })
);

// ─── Chat CRUD ───────────────────────────────────────────────────────────────

router.get(
  "/chats",
  asyncHandler(async (req, res) => {
    const chats = await nutritionService.listChats(req.user!._id.toString());
    sendSuccess(res, chats);
  })
);

router.post(
  "/chats",
  asyncHandler(async (req, res) => {
    const chat = await nutritionService.createChat(req.user!._id.toString());
    sendSuccess(res, chat, 201);
  })
);

router.get(
  "/chats/:chatId",
  asyncHandler(async (req, res) => {
    const chat = await nutritionService.getChat(
      req.user!._id.toString(),
      req.params.chatId
    );
    sendSuccess(res, chat);
  })
);

router.delete(
  "/chats/:chatId",
  asyncHandler(async (req, res) => {
    await nutritionService.deleteChat(
      req.user!._id.toString(),
      req.params.chatId
    );
    sendSuccess(res, null, 200, "Chat deleted");
  })
);

// ─── Chat Message ────────────────────────────────────────────────────────────

router.post(
  "/chats/:chatId/messages",
  validate(nutritionChatMessageSchema),
  asyncHandler(async (req, res) => {
    const { reply, chat } = await nutritionService.sendMessage(
      req.user!._id.toString(),
      req.params.chatId,
      req.body.text,
      req.body.imageUrl
    );
    sendSuccess(res, { reply, chat });
  })
);

export default router;
