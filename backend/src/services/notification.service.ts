import { Notification, INotification, NotificationType } from "../models/Notification";
import { User } from "../models/User";
import { getIO } from "./socket.service";
import { getMessaging } from "../config/firebase";
import { logger } from "../utils/logger";

export class NotificationService {
  // ─────────────────────────────────────────────────────────────────────────
  // Create & deliver
  // ─────────────────────────────────────────────────────────────────────────

  async create(params: {
    userId:      string;
    type:        NotificationType;
    fromUserId?: string;
    postId?:     string;
    text:        string;
    data?:       Record<string, unknown>;
  }): Promise<INotification> {
    const notification = await Notification.create({
      userId:     params.userId,
      type:       params.type,
      fromUserId: params.fromUserId ?? null,
      postId:     params.postId ?? null,
      text:       params.text,
      data:       params.data ?? null,
    });

    // Real-time in-app delivery
    try {
      const io = getIO();
      io.to(`user:${params.userId}`).emit("notification:new", notification.toObject());

      const count = await Notification.countDocuments({ userId: params.userId, read: false });
      io.to(`user:${params.userId}`).emit("notification:count", { count });
    } catch {
      // Socket not initialized (test env) — skip
    }

    // FCM push (fire-and-forget)
    this.sendPush(params.userId, params.text, params.type).catch((err) =>
      logger.warn("Push notification failed", { err })
    );

    return notification;
  }

  /** Wrap create() with silent error handling — use in background hooks */
  async createSilent(params: Parameters<NotificationService["create"]>[0]): Promise<void> {
    try {
      await this.create(params);
    } catch (err) {
      logger.warn("Notification creation failed (non-critical)", { err });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FCM push
  // ─────────────────────────────────────────────────────────────────────────

  private async sendPush(
    userId: string,
    text:   string,
    type:   NotificationType
  ): Promise<void> {
    const messaging = getMessaging();
    if (!messaging) return;

    const user = await User.findById(userId).select("pushTokens settings").lean();
    if (!user || !user.settings?.notifications) return;
    if (!user.pushTokens || user.pushTokens.length === 0) return;

    const invalidTokens: string[] = [];

    for (const tokenInfo of user.pushTokens) {
      try {
        await messaging.send({
          token: tokenInfo.token,
          notification: { title: "HabitForge", body: text },
          data: { type },
        });
      } catch (err: any) {
        if (
          err?.errorInfo?.code === "messaging/registration-token-not-registered" ||
          err?.errorInfo?.code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokenInfo.token);
        }
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushTokens: { token: { $in: invalidTokens } } },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Query
  // ─────────────────────────────────────────────────────────────────────────

  async list(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ notifications: INotification[]; total: number }> {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("fromUserId", "username avatarUrl")
        .lean(),
      Notification.countDocuments({ userId }),
    ]);
    return { notifications: notifications as unknown as INotification[], total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, read: false });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true }
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, read: false }, { read: true });

    // Update socket badge
    try {
      getIO().to(`user:${userId}`).emit("notification:count", { count: 0 });
    } catch { /* skip */ }
  }

  async updateSettings(
    userId: string,
    settings: { notifications?: boolean; reminderTime?: string }
  ): Promise<void> {
    const update: Record<string, unknown> = {};
    if (settings.notifications !== undefined)
      update["settings.notifications"] = settings.notifications;
    if (settings.reminderTime !== undefined)
      update["settings.reminderTime"] = settings.reminderTime;

    await User.findByIdAndUpdate(userId, { $set: update });
  }
}
