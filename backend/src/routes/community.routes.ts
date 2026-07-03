import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/response";
import { CommunityService } from "../services/community.service";

const router = Router();
const service = new CommunityService();

router.use(authenticate);

const uid = (req: Request) => (req as any).user.id as string;
const page = (req: Request) => Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
const limit = (req: Request) => Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "20", 10)));

// ── Follow ────────────────────────────────────────────────────────────────────

/**
 * POST /api/community/follow/:username
 * Follow a public user (accepted immediately) or send a follow request to a
 * private account (status = "pending").
 */
router.post(
  "/follow/:username",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.followUser(uid(req), req.params.username);
    const msg = result.status === "accepted" ? "Followed" : "Follow request sent";
    sendSuccess(res, result, 200, msg);
  })
);

/**
 * DELETE /api/community/follow/:username
 * Unfollow a user OR cancel a pending outgoing follow request.
 */
router.delete(
  "/follow/:username",
  asyncHandler(async (req: Request, res: Response) => {
    await service.unfollowUser(uid(req), req.params.username);
    sendSuccess(res, null, 200, "Unfollowed");
  })
);

/**
 * POST /api/community/follow/:username/accept
 * Accept an incoming follow request (account owner only).
 */
router.post(
  "/follow/:username/accept",
  asyncHandler(async (req: Request, res: Response) => {
    await service.acceptRequest(uid(req), req.params.username);
    sendSuccess(res, null, 200, "Follow request accepted");
  })
);

/**
 * POST /api/community/follow/:username/decline
 * Decline an incoming follow request (account owner only).
 */
router.post(
  "/follow/:username/decline",
  asyncHandler(async (req: Request, res: Response) => {
    await service.declineRequest(uid(req), req.params.username);
    sendSuccess(res, null, 200, "Follow request declined");
  })
);

// ── Follower / Following lists ─────────────────────────────────────────────────

/**
 * GET /api/community/followers?page=&limit=
 * My own followers (accepted follows).
 */
router.get(
  "/followers",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { users, total } = await service.getFollowers(uid(req), p, l);
    sendSuccess(res, users, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

/**
 * GET /api/community/following?page=&limit=
 * People I follow.
 */
router.get(
  "/following",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { users, total } = await service.getFollowing(uid(req), p, l);
    sendSuccess(res, users, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

// ── Follow Requests ───────────────────────────────────────────────────────────

/**
 * GET /api/community/requests/incoming?page=&limit=
 * Pending follow requests sent TO me.
 */
router.get(
  "/requests/incoming",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { users, total } = await service.getIncomingRequests(uid(req), p, l);
    sendSuccess(res, users, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

/**
 * GET /api/community/requests/outgoing?page=&limit=
 * Pending follow requests I have sent.
 */
router.get(
  "/requests/outgoing",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { users, total } = await service.getOutgoingRequests(uid(req), p, l);
    sendSuccess(res, users, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

// ── Block ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/community/block/:username
 * Block a user. Removes all existing follow relationships.
 */
router.post(
  "/block/:username",
  asyncHandler(async (req: Request, res: Response) => {
    await service.blockUser(uid(req), req.params.username);
    sendSuccess(res, null, 200, "User blocked");
  })
);

/**
 * DELETE /api/community/block/:username
 * Unblock a user.
 */
router.delete(
  "/block/:username",
  asyncHandler(async (req: Request, res: Response) => {
    await service.unblockUser(uid(req), req.params.username);
    sendSuccess(res, null, 200, "User unblocked");
  })
);

/**
 * GET /api/community/blocked?page=&limit=
 * List of users I have blocked.
 */
router.get(
  "/blocked",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { users, total } = await service.getBlockedList(uid(req), p, l);
    sendSuccess(res, users, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

// ── Discovery ─────────────────────────────────────────────────────────────────

/**
 * GET /api/community/search?q=&page=&limit=
 * Search users by username or bio. Excludes blocked users.
 */
router.get(
  "/search",
  asyncHandler(async (req: Request, res: Response) => {
    const q = (req.query.q as string) ?? "";
    const p = page(req);
    const l = limit(req);
    const { users, total } = await service.searchUsers(uid(req), q, p, l);
    sendSuccess(res, users, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

/**
 * GET /api/community/suggestions?limit=
 * Suggested users to follow (mutual network + popular fallback).
 */
router.get(
  "/suggestions",
  asyncHandler(async (req: Request, res: Response) => {
    const l = Math.min(20, Math.max(1, parseInt((req.query.limit as string) ?? "10", 10)));
    const users = await service.getSuggestions(uid(req), l);
    sendSuccess(res, users);
  })
);

// ── Public profile social lists ───────────────────────────────────────────────

/**
 * GET /api/community/:username/followers?page=&limit=
 * Any user's followers (public; blocked users see 404).
 */
router.get(
  "/:username/followers",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { users, total } = await service.getUserFollowers(
      req.params.username,
      uid(req),
      p,
      l
    );
    sendSuccess(res, users, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

/**
 * GET /api/community/:username/following?page=&limit=
 * Any user's following list (public; blocked users see 404).
 */
router.get(
  "/:username/following",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { users, total } = await service.getUserFollowing(
      req.params.username,
      uid(req),
      p,
      l
    );
    sendSuccess(res, users, 200, undefined, {
      page: p, limit: l, total, totalPages: Math.ceil(total / l),
    });
  })
);

export default router;
