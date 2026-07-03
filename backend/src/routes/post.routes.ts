import { Router, Request, Response } from "express";
import Joi from "joi";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { sendSuccess } from "../utils/response";
import { PostService } from "../services/post.service";
import { Errors } from "../utils/AppError";

const router = Router();
const service = new PostService();

router.use(authenticate);

const uid = (req: Request) => (req as any).user.id as string;
const page  = (req: Request) => Math.max(1, parseInt((req.query.page  as string) ?? "1",  10));
const limit = (req: Request) => Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "20", 10)));

// ── Validators ────────────────────────────────────────────────────────────────
const createPostSchema = Joi.object({
  kind:       Joi.string().valid("post", "reel").default("post"),
  format:     Joi.string().valid("text", "gallery", "video").default("text"),
  caption:    Joi.string().max(2200).allow("").default(""),
  media:      Joi.array().items(
    Joi.object({
      url:       Joi.string().uri().required(),
      type:      Joi.string().required(),
      width:     Joi.number(),
      height:    Joi.number(),
      thumbnail: Joi.string().uri(),
    })
  ).max(10).default([]),
  tags:       Joi.array().items(Joi.string().lowercase().trim()).default([]),
  song:       Joi.string().max(200).allow("").default(""),
  visibility: Joi.string().valid("public", "followers", "private").default("public"),
});

const updatePostSchema = Joi.object({
  caption:    Joi.string().max(2200).allow(""),
  tags:       Joi.array().items(Joi.string().lowercase().trim()),
  visibility: Joi.string().valid("public", "followers", "private"),
}).min(1);

const addCommentSchema = Joi.object({
  text: Joi.string().trim().min(1).max(1000).required(),
});

// ── Collection feeds (must be before /:id) ────────────────────────────────────

/**
 * GET /api/posts/feed?page=&limit=
 * Personalized feed (followed users + own posts).
 */
router.get(
  "/feed",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { posts, total } = await service.getFeed(uid(req), p, l);
    sendSuccess(res, posts, 200, undefined, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  })
);

/**
 * GET /api/posts/explore?page=&limit=
 * Explore / trending feed (public posts, sorted by popularity).
 */
router.get(
  "/explore",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { posts, total } = await service.getExploreFeed(uid(req), p, l);
    sendSuccess(res, posts, 200, undefined, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  })
);

/**
 * GET /api/posts/saved?page=&limit=
 * My bookmarked posts.
 */
router.get(
  "/saved",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { posts, total } = await service.getSavedPosts(uid(req), p, l);
    sendSuccess(res, posts, 200, undefined, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  })
);

/**
 * GET /api/posts/user/:username?page=&limit=
 * A specific user's posts.
 */
router.get(
  "/user/:username",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { posts, total } = await service.getUserPosts(req.params.username, uid(req), p, l);
    sendSuccess(res, posts, 200, undefined, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  })
);

/**
 * GET /api/posts/tag/:tag?page=&limit=
 * Posts by hashtag.
 */
router.get(
  "/tag/:tag",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { posts, total } = await service.getPostsByTag(req.params.tag, uid(req), p, l);
    sendSuccess(res, posts, 200, undefined, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  })
);

// ── Single post CRUD ──────────────────────────────────────────────────────────

/**
 * POST /api/posts
 * Create a new post.
 */
router.post(
  "/",
  validate(createPostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const post = await service.createPost(uid(req), req.body);
    sendSuccess(res, post, 201, "Post created");
  })
);

/**
 * GET /api/posts/:id
 * Get a single post (with privacy + block enforcement).
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const post = await service.getPost(req.params.id, uid(req));
    sendSuccess(res, post);
  })
);

/**
 * PATCH /api/posts/:id
 * Edit caption, tags, or visibility (owner only).
 */
router.patch(
  "/:id",
  validate(updatePostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const post = await service.updatePost(uid(req), req.params.id, req.body);
    sendSuccess(res, post, 200, "Post updated");
  })
);

/**
 * DELETE /api/posts/:id
 * Delete post (owner only). Cascades to likes/comments/reposts/saves.
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    await service.deletePost(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Post deleted");
  })
);

// ── Likes ─────────────────────────────────────────────────────────────────────

/** POST /api/posts/:id/like */
router.post(
  "/:id/like",
  asyncHandler(async (req: Request, res: Response) => {
    await service.likePost(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Liked");
  })
);

/** DELETE /api/posts/:id/like */
router.delete(
  "/:id/like",
  asyncHandler(async (req: Request, res: Response) => {
    await service.unlikePost(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Unliked");
  })
);

// ── Comments ──────────────────────────────────────────────────────────────────

/** GET /api/posts/:id/comments?page=&limit= */
router.get(
  "/:id/comments",
  asyncHandler(async (req: Request, res: Response) => {
    const p = page(req);
    const l = limit(req);
    const { comments, total } = await service.getComments(req.params.id, p, l);
    sendSuccess(res, comments, 200, undefined, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
  })
);

/** POST /api/posts/:id/comments */
router.post(
  "/:id/comments",
  validate(addCommentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const comment = await service.addComment(uid(req), req.params.id, req.body.text);
    sendSuccess(res, comment, 201, "Comment added");
  })
);

/** PATCH /api/posts/:id/comments/:commentId */
router.patch(
  "/:id/comments/:commentId",
  validate(addCommentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const comment = await service.editComment(uid(req), req.params.id, req.params.commentId, req.body.text);
    sendSuccess(res, comment, 200, "Comment updated");
  })
);

/** DELETE /api/posts/:id/comments/:commentId */
router.delete(
  "/:id/comments/:commentId",
  asyncHandler(async (req: Request, res: Response) => {
    await service.deleteComment(uid(req), req.params.id, req.params.commentId);
    sendSuccess(res, null, 200, "Comment deleted");
  })
);

// ── Repost ────────────────────────────────────────────────────────────────────

/** POST /api/posts/:id/repost */
router.post(
  "/:id/repost",
  asyncHandler(async (req: Request, res: Response) => {
    await service.repostPost(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Reposted");
  })
);

/** DELETE /api/posts/:id/repost */
router.delete(
  "/:id/repost",
  asyncHandler(async (req: Request, res: Response) => {
    await service.unrepostPost(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Repost removed");
  })
);

// ── Save / Bookmark ───────────────────────────────────────────────────────────

/** POST /api/posts/:id/save */
router.post(
  "/:id/save",
  asyncHandler(async (req: Request, res: Response) => {
    await service.savePost(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Saved");
  })
);

/** DELETE /api/posts/:id/save */
router.delete(
  "/:id/save",
  asyncHandler(async (req: Request, res: Response) => {
    await service.unsavePost(uid(req), req.params.id);
    sendSuccess(res, null, 200, "Unsaved");
  })
);

export default router;
