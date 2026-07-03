import { Router } from "express";
import { UserService } from "../services/user.service";
import { CommunityService } from "../services/community.service";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import { sendSuccess } from "../utils/response";
import { User } from "../models/User";
import Joi from "joi";
import { validate } from "../middleware/validate";

const router  = Router();
const service = new UserService();
const community = new CommunityService();

const updateProfileSchema = Joi.object({
  username:  Joi.string().alphanum().min(3).max(30),
  bio:       Joi.string().max(300).allow(""),
  avatarUrl: Joi.string().uri().allow(null),
  timezone:  Joi.string().max(60),
}).min(1);

// GET /api/users/me
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await service.getProfile(req.user!._id.toString());
    sendSuccess(res, user);
  })
);

// PATCH /api/users/me
router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const updated = await service.updateProfile(req.user!._id.toString(), req.body);
    sendSuccess(res, updated, 200, "Profile updated");
  })
);

// DELETE /api/users/me
router.delete(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    await service.deleteAccount(req.user!._id.toString());
    sendSuccess(res, null, 200, "Account deleted");
  })
);

// GET /api/users/search?q=...&page=...&limit=...
router.get(
  "/search",
  authenticate,
  asyncHandler(async (req, res) => {
    const q     = (req.query.q as string)     ?? "";
    const page  = parseInt(req.query.page  as string ?? "1",  10);
    const limit = parseInt(req.query.limit as string ?? "20", 10);

    const { users, total } = await service.searchUsers(q, page, limit);
    sendSuccess(res, users, 200, undefined, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  })
);

// GET /api/users/:username
router.get(
  "/:username",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await service.getUserByUsername(req.params.username);
    sendSuccess(res, user);
  })
);

// POST /api/users/:username/follow  (delegates to CommunityService)
router.post(
  "/:username/follow",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await community.followUser(req.user!._id.toString(), req.params.username);
    const msg = result.status === "accepted" ? "Followed" : "Follow request sent";
    sendSuccess(res, result, 200, msg);
  })
);

// DELETE /api/users/:username/follow  (delegates to CommunityService)
router.delete(
  "/:username/follow",
  authenticate,
  asyncHandler(async (req, res) => {
    await community.unfollowUser(req.user!._id.toString(), req.params.username);
    sendSuccess(res, null, 200, "Unfollowed");
  })
);

// POST /api/users/me/push-token — register a device push token
router.post(
  "/me/push-token",
  authenticate,
  validate(Joi.object({
    token:    Joi.string().required(),
    platform: Joi.string().valid("ios", "android", "web").default(""),
  })),
  asyncHandler(async (req, res) => {
    const { token, platform } = req.body as { token: string; platform: string };
    // Remove existing entry for this token first (avoid duplicates), then add
    await User.findByIdAndUpdate(req.user!._id, {
      $pull: { pushTokens: { token } },
    });
    await User.findByIdAndUpdate(req.user!._id, {
      $push: { pushTokens: { token, platform, createdAt: new Date() } },
    });
    sendSuccess(res, null, 200, "Push token registered");
  })
);

// DELETE /api/users/me/push-token — remove a device push token
router.delete(
  "/me/push-token",
  authenticate,
  validate(Joi.object({ token: Joi.string().required() })),
  asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user!._id, {
      $pull: { pushTokens: { token: req.body.token } },
    });
    sendSuccess(res, null, 200, "Push token removed");
  })
);

export default router;
