import { Report, IReport, ReportStatus } from "../models/Report";
import { AdminLog } from "../models/AdminLog";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { Journey } from "../models/Journey";
import { NotificationService } from "./notification.service";
import { getRedis } from "../config/redis";
import { Errors } from "../utils/AppError";
import { today } from "../utils/dateUtils";

const notifService = new NotificationService();

export class AdminService {
  // ─────────────────────────────────────────────────────────────────────────
  // Reports — User-facing
  // ─────────────────────────────────────────────────────────────────────────

  async submitReport(
    reporterId: string,
    data: {
      targetType: string;
      targetId: string;
      reason: string;
      description?: string;
    }
  ): Promise<IReport> {
    // Rate limit: 10 reports per day per user
    const redis = getRedis();
    const key = `report:rate:${reporterId}:${today()}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 86400);
    if (count > 10) throw Errors.tooManyRequests();

    // Prevent duplicate reports on same target
    const existing = await Report.findOne({
      reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      status: { $in: ["pending", "reviewed"] },
    });
    if (existing) throw Errors.conflict("You have already reported this content");

    return Report.create({
      reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      description: data.description ?? "",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reports — Admin
  // ─────────────────────────────────────────────────────────────────────────

  async listReports(
    status: ReportStatus | "all",
    page: number,
    limit: number
  ): Promise<{ reports: IReport[]; total: number }> {
    const filter = status === "all" ? {} : { status };
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reporterId", "username avatarUrl")
        .populate("reviewedBy", "username")
        .lean(),
      Report.countDocuments(filter),
    ]);

    return { reports: reports as unknown as IReport[], total };
  }

  async reviewReport(
    adminId: string,
    reportId: string,
    data: { status: ReportStatus; action?: string }
  ): Promise<IReport> {
    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status: data.status,
        action: data.action ?? null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      { new: true }
    ).lean();
    if (!report) throw Errors.notFound("Report");

    await this.log(adminId, "review_report", "report", reportId, {
      status: data.status,
      action: data.action,
    });

    return report as unknown as IReport;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // User Moderation
  // ─────────────────────────────────────────────────────────────────────────

  async suspendUser(
    adminId: string,
    targetUserId: string,
    days: number,
    reason?: string
  ): Promise<void> {
    const user = await User.findById(targetUserId);
    if (!user) throw Errors.notFound("User");
    if (user.role === "admin") throw Errors.forbidden();

    const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await User.updateOne(
      { _id: targetUserId },
      { suspendedUntil, banReason: reason ?? `Suspended for ${days} days` }
    );

    await this.log(adminId, "suspend_user", "user", targetUserId, { days, reason });

    await notifService.create({
      userId: targetUserId,
      type: "system",
      text: `Your account has been suspended for ${days} days. Reason: ${reason ?? "Policy violation"}`,
    });
  }

  async unsuspendUser(adminId: string, targetUserId: string): Promise<void> {
    const result = await User.updateOne(
      { _id: targetUserId },
      { suspendedUntil: null, banReason: null }
    );
    if (result.matchedCount === 0) throw Errors.notFound("User");

    await this.log(adminId, "unsuspend_user", "user", targetUserId, {});

    await notifService.create({
      userId: targetUserId,
      type: "system",
      text: "Your account suspension has been lifted.",
    });
  }

  async banUser(
    adminId: string,
    targetUserId: string,
    reason?: string
  ): Promise<void> {
    const user = await User.findById(targetUserId);
    if (!user) throw Errors.notFound("User");
    if (user.role === "admin") throw Errors.forbidden();

    await User.updateOne(
      { _id: targetUserId },
      { banned: true, banReason: reason ?? "Permanently banned" }
    );

    await this.log(adminId, "ban_user", "user", targetUserId, { reason });
  }

  async unbanUser(adminId: string, targetUserId: string): Promise<void> {
    const result = await User.updateOne(
      { _id: targetUserId },
      { banned: false, banReason: null, suspendedUntil: null }
    );
    if (result.matchedCount === 0) throw Errors.notFound("User");

    await this.log(adminId, "unban_user", "user", targetUserId, {});
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Content Removal
  // ─────────────────────────────────────────────────────────────────────────

  async removePost(adminId: string, postId: string): Promise<void> {
    const post = await Post.findByIdAndDelete(postId);
    if (!post) throw Errors.notFound("Post");

    await this.log(adminId, "remove_post", "post", postId, {});

    // Notify post author
    await notifService.create({
      userId: post.userId.toString(),
      type: "system",
      text: "Your post was removed for violating community guidelines.",
    });
  }

  async removeJourney(adminId: string, journeyId: string): Promise<void> {
    const journey = await Journey.findByIdAndDelete(journeyId);
    if (!journey) throw Errors.notFound("Journey");

    await this.log(adminId, "remove_journey", "journey", journeyId, {});

    await notifService.create({
      userId: journey.userId.toString(),
      type: "system",
      text: "Your journey was removed for violating community guidelines.",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Platform Analytics
  // ─────────────────────────────────────────────────────────────────────────

  async getAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalJourneys: number;
    pendingReports: number;
    bannedUsers: number;
    newUsersToday: number;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalJourneys,
      pendingReports,
      bannedUsers,
      newUsersToday,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastSeenAt: { $gte: lastWeek } }),
      Post.countDocuments(),
      Journey.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      User.countDocuments({ banned: true }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalPosts,
      totalJourneys,
      pendingReports,
      bannedUsers,
      newUsersToday,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Admin Action Logs
  // ─────────────────────────────────────────────────────────────────────────

  async getLogs(
    page: number,
    limit: number
  ): Promise<{ logs: Record<string, unknown>[]; total: number }> {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AdminLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("adminId", "username")
        .lean(),
      AdminLog.countDocuments(),
    ]);
    return { logs: logs as unknown as Record<string, unknown>[], total };
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async log(
    adminId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await AdminLog.create({
      adminId,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      details: details ?? null,
    });
  }
}

export const adminService = new AdminService();
