import { Journey, IJourney } from "../models/Journey";
import { JourneyLike } from "../models/JourneyLike";
import { JourneyComment, IJourneyComment } from "../models/JourneyComment";
import { NotificationService } from "./notification.service";
import { Errors } from "../utils/AppError";

const notifService = new NotificationService();

export class JourneyService {
  // ─────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────

  async create(
    userId: string,
    data: { challenge: string; helped: string; overcame: string; habitTags?: string[]; visibility?: string }
  ): Promise<IJourney> {
    return Journey.create({
      userId,
      challenge: data.challenge,
      helped: data.helped,
      overcame: data.overcame,
      habitTags: data.habitTags ?? [],
      visibility: data.visibility ?? "public",
    });
  }

  async getById(journeyId: string, requesterId?: string): Promise<IJourney & { liked?: boolean }> {
    const journey = await Journey.findById(journeyId)
      .populate("userId", "username firstName lastName avatarUrl")
      .lean();
    if (!journey) throw Errors.notFound("Journey");

    // Check visibility
    const j = journey as unknown as IJourney;
    if (j.visibility === "private" && j.userId.toString() !== requesterId) {
      throw Errors.notFound("Journey");
    }

    let liked = false;
    if (requesterId) {
      const existing = await JourneyLike.findOne({ userId: requesterId, journeyId });
      liked = !!existing;
    }

    return { ...(journey as unknown as IJourney), liked } as IJourney & { liked: boolean };
  }

  async update(
    userId: string,
    journeyId: string,
    data: Partial<{ challenge: string; helped: string; overcame: string; habitTags: string[]; visibility: string }>
  ): Promise<IJourney> {
    const journey = await Journey.findOneAndUpdate(
      { _id: journeyId, userId },
      { $set: data },
      { new: true }
    ).lean();
    if (!journey) throw Errors.notFound("Journey");
    return journey as unknown as IJourney;
  }

  async delete(userId: string, journeyId: string): Promise<void> {
    const result = await Journey.findOneAndDelete({ _id: journeyId, userId });
    if (!result) throw Errors.notFound("Journey");
    // Cleanup related data
    await JourneyLike.deleteMany({ journeyId });
    await JourneyComment.deleteMany({ journeyId });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // My Journeys
  // ─────────────────────────────────────────────────────────────────────────

  async getMyJourneys(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ journeys: IJourney[]; total: number }> {
    const skip = (page - 1) * limit;
    const [journeys, total] = await Promise.all([
      Journey.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Journey.countDocuments({ userId }),
    ]);
    return { journeys: journeys as unknown as IJourney[], total };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public Feed
  // ─────────────────────────────────────────────────────────────────────────

  async getFeed(
    page: number,
    limit: number,
    requesterId?: string
  ): Promise<{ journeys: (IJourney & { liked: boolean })[]; total: number }> {
    const skip = (page - 1) * limit;
    const [journeys, total] = await Promise.all([
      Journey.find({ visibility: "public" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "username firstName lastName avatarUrl")
        .lean(),
      Journey.countDocuments({ visibility: "public" }),
    ]);

    let likedSet = new Set<string>();
    if (requesterId) {
      const journeyIds = journeys.map((j) => (j as unknown as IJourney)._id);
      const likes = await JourneyLike.find({
        userId: requesterId,
        journeyId: { $in: journeyIds },
      }).lean();
      likedSet = new Set(likes.map((l) => l.journeyId.toString()));
    }

    const result = journeys.map((j) => ({
      ...(j as unknown as IJourney),
      liked: likedSet.has((j as unknown as IJourney)._id.toString()),
    }));

    return { journeys: result as (IJourney & { liked: boolean })[], total };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Like / Unlike
  // ─────────────────────────────────────────────────────────────────────────

  async like(userId: string, journeyId: string): Promise<{ liked: boolean; likesCount: number }> {
    const journey = await Journey.findById(journeyId);
    if (!journey) throw Errors.notFound("Journey");

    const existing = await JourneyLike.findOne({ userId, journeyId });
    if (existing) {
      // Unlike
      await existing.deleteOne();
      await Journey.updateOne({ _id: journeyId }, { $inc: { likesCount: -1 } });
      const updated = await Journey.findById(journeyId).lean();
      return { liked: false, likesCount: (updated as unknown as IJourney).likesCount };
    }

    // Like
    await JourneyLike.create({ userId, journeyId });
    await Journey.updateOne({ _id: journeyId }, { $inc: { likesCount: 1 } });
    const updated = await Journey.findById(journeyId).lean();

    // Notify journey author (if not self)
    if (journey.userId.toString() !== userId) {
      await notifService.create({
        userId: journey.userId.toString(),
        type: "like",
        fromUserId: userId,
        text: "liked your journey",
        data: { journeyId },
      });
    }

    return { liked: true, likesCount: (updated as unknown as IJourney).likesCount };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Comments
  // ─────────────────────────────────────────────────────────────────────────

  async addComment(
    userId: string,
    journeyId: string,
    text: string
  ): Promise<IJourneyComment> {
    const journey = await Journey.findById(journeyId);
    if (!journey) throw Errors.notFound("Journey");

    const comment = await JourneyComment.create({ journeyId, userId, text });
    await Journey.updateOne({ _id: journeyId }, { $inc: { commentsCount: 1 } });

    // Notify journey author
    if (journey.userId.toString() !== userId) {
      await notifService.create({
        userId: journey.userId.toString(),
        type: "comment",
        fromUserId: userId,
        text: "commented on your journey",
        data: { journeyId, commentId: comment._id.toString() },
      });
    }

    return comment;
  }

  async getComments(
    journeyId: string,
    page: number,
    limit: number
  ): Promise<{ comments: IJourneyComment[]; total: number }> {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      JourneyComment.find({ journeyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "username firstName lastName avatarUrl")
        .lean(),
      JourneyComment.countDocuments({ journeyId }),
    ]);
    return { comments: comments as unknown as IJourneyComment[], total };
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await JourneyComment.findOne({ _id: commentId, userId });
    if (!comment) throw Errors.notFound("Comment");
    await comment.deleteOne();
    await Journey.updateOne({ _id: comment.journeyId }, { $inc: { commentsCount: -1 } });
  }
}

export const journeyService = new JourneyService();
