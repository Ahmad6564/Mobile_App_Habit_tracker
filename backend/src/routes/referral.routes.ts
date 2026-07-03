import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/response";
import { referralService } from "../services/referral.service";
import { applyReferralSchema, leaderboardSchema } from "../validators/referral.validators";

const router = Router();
router.use(authenticate);

// ─── Referral ────────────────────────────────────────────────────────────────

router.get(
  "/referral/code",
  asyncHandler(async (req, res) => {
    const result = await referralService.getMyCode(req.user!._id.toString());
    sendSuccess(res, result);
  })
);

router.get(
  "/referral/stats",
  asyncHandler(async (req, res) => {
    const stats = await referralService.getStats(req.user!._id.toString());
    sendSuccess(res, stats);
  })
);

router.post(
  "/referral/apply",
  validate(applyReferralSchema),
  asyncHandler(async (req, res) => {
    const result = await referralService.applyCode(
      req.user!._id.toString(),
      req.body.code
    );
    sendSuccess(res, result);
  })
);

// ─── Badges ──────────────────────────────────────────────────────────────────

router.get(
  "/badges",
  asyncHandler(async (req, res) => {
    const badges = await referralService.getMyBadges(req.user!._id.toString());
    sendSuccess(res, badges);
  })
);

router.get(
  "/badges/available",
  asyncHandler(async (req, res) => {
    const result = await referralService.getAvailableBadges(req.user!._id.toString());
    sendSuccess(res, result);
  })
);

// ─── Leaderboard ─────────────────────────────────────────────────────────────

router.get(
  "/leaderboard",
  validate(leaderboardSchema, "query"),
  asyncHandler(async (req, res) => {
    const period = (req.query.period as "week" | "month" | "all") || "all";
    const limit = Number(req.query.limit) || 20;
    const leaderboard = await referralService.getLeaderboard(period, limit);
    sendSuccess(res, leaderboard);
  })
);

export default router;
