import { Types } from "mongoose";
import { Post, IPost } from "../models/Post";
import { Like } from "../models/Like";
import { Comment } from "../models/Comment";
import { Repost } from "../models/Repost";
import { Save } from "../models/Save";
import { Follow } from "../models/Follow";
import { Block } from "../models/Block";
import { User } from "../models/User";
import { Errors } from "../utils/AppError";
import { NotificationService } from "./notification.service";

const notifService = new NotificationService();

const DEFAULT_LIMIT = 20;

type PostDoc = Record<string, unknown>;

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Get blocked IDs in both directions for a user */
async function getBlockedIds(userId: string): Promise<Types.ObjectId[]> {
  const blocks = await Block.find({
    $or: [{ blockerId: userId }, { blockedId: userId }],
  }).lean();
  return blocks.map((b) =>
    b.blockerId.toString() === userId ? b.blockedId : b.blockerId
  );
}

/** Enrich a list of lean posts with viewer interaction flags */
async function enrichPosts(
  posts: PostDoc[],
  viewerId: string
): Promise<PostDoc[]> {
  if (!posts.length) return posts;

  const postIds = posts.map((p: any) => p._id);
  const viewerOid = new Types.ObjectId(viewerId);

  const [likes, saves, reposts, authorIds] = await Promise.all([
    Like.find({ userId: viewerOid, postId: { $in: postIds } }).lean(),
    Save.find({ userId: viewerOid, postId: { $in: postIds } }).lean(),
    Repost.find({ userId: viewerOid, postId: { $in: postIds } }).lean(),
    Promise.resolve([...new Set(posts.map((p: any) => p.userId?.toString()))]),
  ]);

  const likedSet = new Set(likes.map((l) => l.postId.toString()));
  const savedSet = new Set(saves.map((s) => s.postId.toString()));
  const repostedSet = new Set(reposts.map((r) => r.postId.toString()));

  // Fetch author usernames in bulk
  const authors = await User.find({
    _id: { $in: authorIds.map((id) => new Types.ObjectId(id)) },
  })
    .select("username avatarUrl")
    .lean();
  const authorMap: Record<string, Record<string, unknown>> = {};
  for (const a of authors) authorMap[(a as any)._id.toString()] = a as unknown as Record<string, unknown>;

  return posts.map((p: any) => ({
    ...p,
    isLiked:    likedSet.has(p._id.toString()),
    isSaved:    savedSet.has(p._id.toString()),
    isReposted: repostedSet.has(p._id.toString()),
    author:     authorMap[p.userId?.toString()] ?? null,
  }));
}

// ─── PostService ──────────────────────────────────────────────────────────────

export class PostService {
  // ── CRUD ────────────────────────────────────────────────────────────────────

  async createPost(
    userId: string,
    data: {
      kind?: "post" | "reel";
      format?: "text" | "gallery" | "video";
      caption?: string;
      media?: { url: string; type: string; width?: number; height?: number; thumbnail?: string }[];
      tags?: string[];
      song?: string;
      visibility?: "public" | "followers" | "private";
    }
  ): Promise<IPost> {
    const post = await Post.create({ userId, ...data });
    return post;
  }

  async getPost(postId: string, viewerId: string): Promise<PostDoc> {
    const post = await Post.findById(postId).lean();
    if (!post) throw Errors.notFound("Post");

    const isOwner = (post as any).userId?.toString() === viewerId;

    // Privacy check
    if (!isOwner) {
      const visibility = (post as any).visibility;
      if (visibility === "private") throw Errors.notFound("Post");

      if (visibility === "followers") {
        const follows = await Follow.countDocuments({
          followerId: viewerId,
          followingId: (post as any).userId,
          status: "accepted",
        });
        if (!follows) throw Errors.notFound("Post");
      }

      // Block check
      const blocked = await Block.countDocuments({
        $or: [
          { blockerId: viewerId, blockedId: (post as any).userId },
          { blockerId: (post as any).userId, blockedId: viewerId },
        ],
      });
      if (blocked) throw Errors.notFound("Post");
    }

    const [enriched] = await enrichPosts([post as PostDoc], viewerId);
    return enriched;
  }

  async updatePost(
    userId: string,
    postId: string,
    data: { caption?: string; tags?: string[]; visibility?: "public" | "followers" | "private" }
  ): Promise<IPost> {
    const post = await Post.findOneAndUpdate(
      { _id: postId, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!post) throw Errors.notFound("Post");
    return post;
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await Post.findOneAndDelete({ _id: postId, userId });
    if (!post) throw Errors.notFound("Post");

    // Cascade delete interactions
    await Promise.all([
      Like.deleteMany({ postId }),
      Comment.deleteMany({ postId }),
      Repost.deleteMany({ postId }),
      Save.deleteMany({ postId }),
    ]);
  }

  // ── Feeds ───────────────────────────────────────────────────────────────────

  /** Personalized feed: posts from followed users + own posts */
  async getFeed(
    userId: string,
    page = 1,
    limit = DEFAULT_LIMIT
  ): Promise<{ posts: PostDoc[]; total: number }> {
    const [follows, blockedIds] = await Promise.all([
      Follow.find({ followerId: userId, status: "accepted" }).lean(),
      getBlockedIds(userId),
    ]);

    const followingIds = follows.map((f) => f.followingId);
    const authorIds = [...followingIds, new Types.ObjectId(userId)];

    const filter = {
      userId: { $in: authorIds, $nin: blockedIds },
      visibility: { $in: ["public", "followers"] },
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const enriched = await enrichPosts(posts as PostDoc[], userId);
    return { posts: enriched, total };
  }

  /** Explore feed: popular public posts from non-blocked users */
  async getExploreFeed(
    userId: string,
    page = 1,
    limit = DEFAULT_LIMIT
  ): Promise<{ posts: PostDoc[]; total: number }> {
    const blockedIds = await getBlockedIds(userId);

    const filter = {
      userId: { $nin: [new Types.ObjectId(userId), ...blockedIds] },
      visibility: "public",
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ likesCount: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const enriched = await enrichPosts(posts as PostDoc[], userId);
    return { posts: enriched, total };
  }

  /** Get a user's public posts */
  async getUserPosts(
    targetUsername: string,
    viewerId: string,
    page = 1,
    limit = DEFAULT_LIMIT
  ): Promise<{ posts: PostDoc[]; total: number }> {
    const target = await User.findOne({ username: targetUsername });
    if (!target) throw Errors.notFound("User");

    const targetId = target._id.toString();
    const isOwner = targetId === viewerId;

    if (!isOwner) {
      const blocked = await Block.countDocuments({
        $or: [
          { blockerId: viewerId, blockedId: targetId },
          { blockerId: targetId, blockedId: viewerId },
        ],
      });
      if (blocked) throw Errors.notFound("User");
    }

    const visibilityFilter = isOwner
      ? {}
      : { visibility: { $in: ["public", "followers"] } };

    const filter = { userId: targetId, ...visibilityFilter };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const enriched = await enrichPosts(posts as PostDoc[], viewerId);
    return { posts: enriched, total };
  }

  /** Posts by hashtag */
  async getPostsByTag(
    tag: string,
    viewerId: string,
    page = 1,
    limit = DEFAULT_LIMIT
  ): Promise<{ posts: PostDoc[]; total: number }> {
    const blockedIds = await getBlockedIds(viewerId);
    const filter = {
      tags: tag.toLowerCase(),
      visibility: "public",
      userId: { $nin: [new Types.ObjectId(viewerId), ...blockedIds] },
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const enriched = await enrichPosts(posts as PostDoc[], viewerId);
    return { posts: enriched, total };
  }

  /** Saved / bookmarked posts */
  async getSavedPosts(
    userId: string,
    page = 1,
    limit = DEFAULT_LIMIT
  ): Promise<{ posts: PostDoc[]; total: number }> {
    const [saves, total] = await Promise.all([
      Save.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Save.countDocuments({ userId }),
    ]);

    const postIds = saves.map((s) => s.postId);
    const posts = await Post.find({ _id: { $in: postIds } }).lean();
    const enriched = await enrichPosts(posts as PostDoc[], userId);
    return { posts: enriched, total };
  }

  // ── Likes ───────────────────────────────────────────────────────────────────

  async likePost(userId: string, postId: string): Promise<void> {
    const post = await Post.findById(postId);
    if (!post) throw Errors.notFound("Post");

    try {
      await Like.create({ userId, postId });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
    } catch (err: any) {
      if (err?.code === 11000) throw Errors.conflict("Post already liked");
      throw err;
    }

    // Notify post owner (skip if liker is the owner)
    if (post.userId.toString() !== userId) {
      const liker = await User.findById(userId).select("username").lean();
      notifService.createSilent({
        userId:      post.userId.toString(),
        type:        "like",
        fromUserId:  userId,
        postId:      postId,
        text:        `${liker?.username ?? "Someone"} liked your post`,
      });
    }
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    const result = await Like.findOneAndDelete({ userId, postId });
    if (!result) throw Errors.notFound("Like");
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
  }

  // ── Comments ─────────────────────────────────────────────────────────────────

  async getComments(
    postId: string,
    page = 1,
    limit = DEFAULT_LIMIT
  ): Promise<{ comments: Record<string, unknown>[]; total: number }> {
    const post = await Post.findById(postId).lean();
    if (!post) throw Errors.notFound("Post");

    const [comments, total] = await Promise.all([
      Comment.find({ postId })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "username avatarUrl")
        .lean(),
      Comment.countDocuments({ postId }),
    ]);

    return { comments: comments as Record<string, unknown>[], total };
  }

  async addComment(userId: string, postId: string, text: string) {
    const post = await Post.findById(postId);
    if (!post) throw Errors.notFound("Post");

    const comment = await Comment.create({ postId, userId, text });
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // Notify post owner
    if (post.userId.toString() !== userId) {
      const commenter = await User.findById(userId).select("username").lean();
      notifService.createSilent({
        userId:     post.userId.toString(),
        type:       "comment",
        fromUserId: userId,
        postId:     postId,
        text:       `${commenter?.username ?? "Someone"} commented: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`
      });
    }

    return comment.populate("userId", "username avatarUrl");
  }

  async editComment(userId: string, postId: string, commentId: string, text: string) {
    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, postId, userId },
      { text },
      { new: true, runValidators: true }
    ).populate("userId", "username avatarUrl");
    if (!comment) throw Errors.notFound("Comment");
    return comment;
  }

  async deleteComment(userId: string, postId: string, commentId: string): Promise<void> {
    const comment = await Comment.findOneAndDelete({ _id: commentId, postId, userId });
    if (!comment) throw Errors.notFound("Comment");
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });
  }

  // ── Repost ───────────────────────────────────────────────────────────────────

  async repostPost(userId: string, postId: string): Promise<void> {
    const post = await Post.findById(postId);
    if (!post) throw Errors.notFound("Post");

    try {
      await Repost.create({ userId, postId });
      await Post.findByIdAndUpdate(postId, { $inc: { repostsCount: 1 } });
    } catch (err: any) {
      if (err?.code === 11000) throw Errors.conflict("Post already reposted");
      throw err;
    }

    if (post.userId.toString() !== userId) {
      const reposter = await User.findById(userId).select("username").lean();
      notifService.createSilent({
        userId:     post.userId.toString(),
        type:       "repost",
        fromUserId: userId,
        postId:     postId,
        text:       `${reposter?.username ?? "Someone"} reposted your post`,
      });
    }
  }

  async unrepostPost(userId: string, postId: string): Promise<void> {
    const result = await Repost.findOneAndDelete({ userId, postId });
    if (!result) throw Errors.notFound("Repost");
    await Post.findByIdAndUpdate(postId, { $inc: { repostsCount: -1 } });
  }

  // ── Save / Bookmark ──────────────────────────────────────────────────────────

  async savePost(userId: string, postId: string): Promise<void> {
    const post = await Post.findById(postId);
    if (!post) throw Errors.notFound("Post");

    try {
      await Save.create({ userId, postId });
    } catch (err: any) {
      if (err?.code === 11000) throw Errors.conflict("Post already saved");
      throw err;
    }
  }

  async unsavePost(userId: string, postId: string): Promise<void> {
    const result = await Save.findOneAndDelete({ userId, postId });
    if (!result) throw Errors.notFound("Save");
  }
}
