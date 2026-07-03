import { Types } from "mongoose";
import { User } from "../models/User";
import { Follow } from "../models/Follow";
import { Block } from "../models/Block";
import { Errors } from "../utils/AppError";
import { NotificationService } from "./notification.service";

const notifService = new NotificationService();

type PublicUser = Record<string, unknown>;
type PaginatedUsers = { users: PublicUser[]; total: number };

const PAGE_LIMIT = 20;

export class CommunityService {
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Returns true if blocker has blocked blockedId OR vice-versa */
  async isBlocked(userA: string, userB: string): Promise<boolean> {
    const count = await Block.countDocuments({
      $or: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    });
    return count > 0;
  }

  /** Sync follower/following arrays on User documents after a follow is accepted */
  private async syncUserArrays(
    followerId: string,
    followingId: string,
    op: "$addToSet" | "$pull"
  ): Promise<void> {
    const followerOid = new Types.ObjectId(followerId);
    const followingOid = new Types.ObjectId(followingId);
    await Promise.all([
      User.findByIdAndUpdate(followerId, { [op]: { following: followingOid } }),
      User.findByIdAndUpdate(followingId, { [op]: { followers: followerOid } }),
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Follow / Unfollow
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Follow a user.
   * - If target account is public  → follow is accepted immediately.
   * - If target account is private → creates a pending request.
   */
  async followUser(
    followerId: string,
    targetUsername: string
  ): Promise<{ status: "accepted" | "pending" }> {
    const target = await User.findOne({ username: targetUsername });
    if (!target) throw Errors.notFound("User");

    const targetId = target._id.toString();
    if (followerId === targetId) throw Errors.badRequest("Cannot follow yourself");
    if (target.banned) throw Errors.notFound("User");

    const blocked = await this.isBlocked(followerId, targetId);
    if (blocked) throw Errors.forbidden();

    const existing = await Follow.findOne({ followerId, followingId: targetId });
    if (existing) {
      // Already following or request already pending
      return { status: existing.status };
    }

    const privacy: string = (target as any).privacy ?? "public";
    const status: "accepted" | "pending" = privacy === "private" ? "pending" : "accepted";

    await Follow.create({ followerId, followingId: targetId, status });

    if (status === "accepted") {
      await this.syncUserArrays(followerId, targetId, "$addToSet");
      // Notify the person being followed
      const follower = await User.findById(followerId).select("username").lean();
      notifService.createSilent({
        userId:     targetId,
        type:       "follow",
        fromUserId: followerId,
        text:       `${follower?.username ?? "Someone"} started following you`,
      });
    } else {
      // Notify the private-account owner about the pending request
      const requester = await User.findById(followerId).select("username").lean();
      notifService.createSilent({
        userId:     targetId,
        type:       "follow_request",
        fromUserId: followerId,
        text:       `${requester?.username ?? "Someone"} sent you a follow request`,
      });
    }

    return { status };
  }

  /**
   * Unfollow a user OR cancel a pending outgoing request.
   */
  async unfollowUser(followerId: string, targetUsername: string): Promise<void> {
    const target = await User.findOne({ username: targetUsername });
    if (!target) throw Errors.notFound("User");

    const targetId = target._id.toString();
    const follow = await Follow.findOneAndDelete({ followerId, followingId: targetId });

    if (follow?.status === "accepted") {
      await this.syncUserArrays(followerId, targetId, "$pull");
    }
  }

  /**
   * Accept an incoming follow request (called by the account owner).
   */
  async acceptRequest(ownerId: string, requesterUsername: string): Promise<void> {
    const requester = await User.findOne({ username: requesterUsername });
    if (!requester) throw Errors.notFound("User");

    const requesterId = requester._id.toString();
    const follow = await Follow.findOneAndUpdate(
      { followerId: requesterId, followingId: ownerId, status: "pending" },
      { status: "accepted" },
      { new: true }
    );
    if (!follow) throw Errors.notFound("Follow request");

    await this.syncUserArrays(requesterId, ownerId, "$addToSet");

    // Notify the requester that their request was accepted
    const owner = await User.findById(ownerId).select("username").lean();
    notifService.createSilent({
      userId:     requesterId,
      type:       "follow",
      fromUserId: ownerId,
      text:       `${owner?.username ?? "Someone"} accepted your follow request`,
    });
  }

  /**
   * Decline an incoming follow request (called by the account owner).
   */
  async declineRequest(ownerId: string, requesterUsername: string): Promise<void> {
    const requester = await User.findOne({ username: requesterUsername });
    if (!requester) throw Errors.notFound("User");

    const requesterId = requester._id.toString();
    const result = await Follow.findOneAndDelete({
      followerId: requesterId,
      followingId: ownerId,
      status: "pending",
    });
    if (!result) throw Errors.notFound("Follow request");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Follower / Following lists
  // ─────────────────────────────────────────────────────────────────────────

  async getFollowers(
    userId: string,
    page = 1,
    limit = PAGE_LIMIT
  ): Promise<PaginatedUsers> {
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      Follow.find({ followingId: userId, status: "accepted" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ followingId: userId, status: "accepted" }),
    ]);

    const ids = follows.map((f) => f.followerId);
    const users = await User.find({ _id: { $in: ids }, banned: false })
      .select("username firstName lastName avatarUrl bio currentStreak")
      .lean() as PublicUser[];

    return { users, total };
  }

  async getFollowing(
    userId: string,
    page = 1,
    limit = PAGE_LIMIT
  ): Promise<PaginatedUsers> {
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      Follow.find({ followerId: userId, status: "accepted" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ followerId: userId, status: "accepted" }),
    ]);

    const ids = follows.map((f) => f.followingId);
    const users = await User.find({ _id: { $in: ids }, banned: false })
      .select("username firstName lastName avatarUrl bio currentStreak")
      .lean() as PublicUser[];

    return { users, total };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Follow Requests
  // ─────────────────────────────────────────────────────────────────────────

  /** Pending requests coming IN (others want to follow me) */
  async getIncomingRequests(
    userId: string,
    page = 1,
    limit = PAGE_LIMIT
  ): Promise<PaginatedUsers> {
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      Follow.find({ followingId: userId, status: "pending" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ followingId: userId, status: "pending" }),
    ]);

    const ids = follows.map((f) => f.followerId);
    const users = await User.find({ _id: { $in: ids }, banned: false })
      .select("username firstName lastName avatarUrl bio")
      .lean() as PublicUser[];

    return { users, total };
  }

  /** Pending requests going OUT (I requested to follow someone) */
  async getOutgoingRequests(
    userId: string,
    page = 1,
    limit = PAGE_LIMIT
  ): Promise<PaginatedUsers> {
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      Follow.find({ followerId: userId, status: "pending" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ followerId: userId, status: "pending" }),
    ]);

    const ids = follows.map((f) => f.followingId);
    const users = await User.find({ _id: { $in: ids }, banned: false })
      .select("username firstName lastName avatarUrl bio")
      .lean() as PublicUser[];

    return { users, total };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Block / Unblock
  // ─────────────────────────────────────────────────────────────────────────

  async blockUser(blockerId: string, targetUsername: string): Promise<void> {
    const target = await User.findOne({ username: targetUsername });
    if (!target) throw Errors.notFound("User");

    const blockedId = target._id.toString();
    if (blockerId === blockedId) throw Errors.badRequest("Cannot block yourself");

    // Remove all follow relationships between the two users
    await Follow.deleteMany({
      $or: [
        { followerId: blockerId, followingId: blockedId },
        { followerId: blockedId, followingId: blockerId },
      ],
    });

    // Sync User arrays
    const blockerOid = new Types.ObjectId(blockerId);
    const blockedOid = new Types.ObjectId(blockedId);
    await Promise.all([
      User.findByIdAndUpdate(blockerId, {
        $pull: { following: blockedOid, followers: blockedOid },
      }),
      User.findByIdAndUpdate(blockedId, {
        $pull: { following: blockerOid, followers: blockerOid },
      }),
    ]);

    // Upsert block record (ignore if already blocked)
    await Block.findOneAndUpdate(
      { blockerId, blockedId },
      { blockerId, blockedId },
      { upsert: true }
    );
  }

  async unblockUser(blockerId: string, targetUsername: string): Promise<void> {
    const target = await User.findOne({ username: targetUsername });
    if (!target) throw Errors.notFound("User");

    const blockedId = target._id.toString();
    const result = await Block.findOneAndDelete({ blockerId, blockedId });
    if (!result) throw Errors.notFound("Block");
  }

  async getBlockedList(
    blockerId: string,
    page = 1,
    limit = PAGE_LIMIT
  ): Promise<PaginatedUsers> {
    const skip = (page - 1) * limit;
    const [blocks, total] = await Promise.all([
      Block.find({ blockerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Block.countDocuments({ blockerId }),
    ]);

    const ids = blocks.map((b) => b.blockedId);
    const users = await User.find({ _id: { $in: ids } })
      .select("username firstName lastName avatarUrl")
      .lean() as PublicUser[];

    return { users, total };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // User Discovery
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Search users by username or bio.
   * Excludes banned users and users who have blocked the searcher (or been blocked).
   */
  async searchUsers(
    searcherId: string,
    query: string,
    page = 1,
    limit = PAGE_LIMIT
  ): Promise<PaginatedUsers> {
    // Get all blocked user IDs (in both directions)
    const blocks = await Block.find({
      $or: [{ blockerId: searcherId }, { blockedId: searcherId }],
    }).lean();

    const blockedIds = blocks.map((b) =>
      b.blockerId.toString() === searcherId ? b.blockedId : b.blockerId
    );

    const filter = {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
      banned: false,
      _id: { $nin: [new Types.ObjectId(searcherId), ...blockedIds] },
    };

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("username firstName lastName avatarUrl bio currentStreak")
        .skip(skip)
        .limit(limit)
        .sort({ totalPoints: -1 })
        .lean() as Promise<PublicUser[]>,
      User.countDocuments(filter),
    ]);

    return { users, total };
  }

  /**
   * Suggested users to follow — people followed by my followings (mutual network).
   * Falls back to most-points users when no mutual connections exist.
   */
  async getSuggestions(
    userId: string,
    limit = 10
  ): Promise<PublicUser[]> {
    // IDs I already follow (accepted)
    const myFollows = await Follow.find({ followerId: userId, status: "accepted" }).lean();
    const followingIds = myFollows.map((f) => f.followingId);

    // IDs who blocked me or I blocked
    const blocks = await Block.find({
      $or: [{ blockerId: userId }, { blockedId: userId }],
    }).lean();
    const blockedIds = blocks.map((b) =>
      b.blockerId.toString() === userId ? b.blockedId : b.blockerId
    );

    const excludeIds = [
      new Types.ObjectId(userId),
      ...followingIds,
      ...blockedIds,
    ];

    // People followed by my connections
    let suggestions: PublicUser[] = [];
    if (followingIds.length > 0) {
      const mutualFollows = await Follow.find({
        followerId: { $in: followingIds },
        followingId: { $nin: excludeIds },
        status: "accepted",
      })
        .limit(limit * 3)
        .lean();

      // Rank by frequency (most followed by my network first)
      const freq: Record<string, number> = {};
      for (const f of mutualFollows) {
        const id = f.followingId.toString();
        freq[id] = (freq[id] ?? 0) + 1;
      }
      const topIds = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => new Types.ObjectId(id));

      suggestions = await User.find({ _id: { $in: topIds }, banned: false })
        .select("username firstName lastName avatarUrl bio currentStreak")
        .lean() as PublicUser[];
    }

    // Fill remaining slots with top-points users
    if (suggestions.length < limit) {
      const remaining = limit - suggestions.length;
      const alreadySuggested = (suggestions as any[]).map((u) => u._id);
      const fallback = await User.find({
        _id: { $nin: [...excludeIds, ...alreadySuggested] },
        banned: false,
      })
        .sort({ totalPoints: -1 })
        .limit(remaining)
        .select("username firstName lastName avatarUrl bio currentStreak")
        .lean() as PublicUser[];

      suggestions = [...suggestions, ...fallback];
    }

    return suggestions;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public profile helpers (used by community routes)
  // ─────────────────────────────────────────────────────────────────────────

  /** Get any user's followers list (publicly accessible) */
  async getUserFollowers(
    targetUsername: string,
    viewerId: string,
    page = 1,
    limit = PAGE_LIMIT
  ): Promise<PaginatedUsers> {
    const target = await User.findOne({ username: targetUsername });
    if (!target) throw Errors.notFound("User");

    const blocked = await this.isBlocked(viewerId, target._id.toString());
    if (blocked) throw Errors.notFound("User");

    return this.getFollowers(target._id.toString(), page, limit);
  }

  async getUserFollowing(
    targetUsername: string,
    viewerId: string,
    page = 1,
    limit = PAGE_LIMIT
  ): Promise<PaginatedUsers> {
    const target = await User.findOne({ username: targetUsername });
    if (!target) throw Errors.notFound("User");

    const blocked = await this.isBlocked(viewerId, target._id.toString());
    if (blocked) throw Errors.notFound("User");

    return this.getFollowing(target._id.toString(), page, limit);
  }
}
