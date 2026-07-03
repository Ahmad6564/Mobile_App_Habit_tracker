import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/response";
import { journeyService } from "../services/journey.service";
import {
  createJourneySchema,
  updateJourneySchema,
  journeyCommentSchema,
  journeyPaginationSchema,
} from "../validators/journey.validators";

const router = Router();
router.use(authenticate);

// ─── CRUD ────────────────────────────────────────────────────────────────────

router.post(
  "/",
  validate(createJourneySchema),
  asyncHandler(async (req, res) => {
    const journey = await journeyService.create(req.user!._id.toString(), req.body);
    sendSuccess(res, journey, 201, "Journey created");
  })
);

router.get(
  "/me",
  validate(journeyPaginationSchema, "query"),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { journeys, total } = await journeyService.getMyJourneys(
      req.user!._id.toString(),
      page,
      limit
    );
    sendSuccess(res, journeys, 200, undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
  })
);

router.get(
  "/feed",
  validate(journeyPaginationSchema, "query"),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { journeys, total } = await journeyService.getFeed(
      page,
      limit,
      req.user!._id.toString()
    );
    sendSuccess(res, journeys, 200, undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
  })
);

router.get(
  "/:journeyId",
  asyncHandler(async (req, res) => {
    const journey = await journeyService.getById(
      req.params.journeyId,
      req.user!._id.toString()
    );
    sendSuccess(res, journey);
  })
);

router.patch(
  "/:journeyId",
  validate(updateJourneySchema),
  asyncHandler(async (req, res) => {
    const journey = await journeyService.update(
      req.user!._id.toString(),
      req.params.journeyId,
      req.body
    );
    sendSuccess(res, journey);
  })
);

router.delete(
  "/:journeyId",
  asyncHandler(async (req, res) => {
    await journeyService.delete(req.user!._id.toString(), req.params.journeyId);
    sendSuccess(res, null, 200, "Journey deleted");
  })
);

// ─── Like / Unlike (toggle) ─────────────────────────────────────────────────

router.post(
  "/:journeyId/like",
  asyncHandler(async (req, res) => {
    const result = await journeyService.like(
      req.user!._id.toString(),
      req.params.journeyId
    );
    sendSuccess(res, result);
  })
);

// ─── Comments ────────────────────────────────────────────────────────────────

router.get(
  "/:journeyId/comments",
  validate(journeyPaginationSchema, "query"),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { comments, total } = await journeyService.getComments(
      req.params.journeyId,
      page,
      limit
    );
    sendSuccess(res, comments, 200, undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
  })
);

router.post(
  "/:journeyId/comments",
  validate(journeyCommentSchema),
  asyncHandler(async (req, res) => {
    const comment = await journeyService.addComment(
      req.user!._id.toString(),
      req.params.journeyId,
      req.body.text
    );
    sendSuccess(res, comment, 201);
  })
);

router.delete(
  "/comments/:commentId",
  asyncHandler(async (req, res) => {
    await journeyService.deleteComment(
      req.user!._id.toString(),
      req.params.commentId
    );
    sendSuccess(res, null, 200, "Comment deleted");
  })
);

export default router;
