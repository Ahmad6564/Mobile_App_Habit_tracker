import crypto from "crypto";
import { Referral, IReferral } from "../models/Referral";
import { Badge, IBadge, BadgeType } from "../models/Badge";
import { User } from "../models/User";
import { Streak } from "../models/Streak";
import { NotificationService } from "./notification.service";
import { Errors } from "../utils/AppError";

const notifService = new NotificationService();

// Badge definitions
const BADGE_DEFS: Record<BadgeType, { name: string; icon: string }> = {
  streak_7:              { name: "Week Warrior",        icon: "🔥" },
  streak_30:             { name: "Monthly Master",      icon: "⚡" },
  streak_100:            { name: "Century Club",        icon: "💯" },
  streak_365:            { name: "Year-Round Champion", icon: "🏆" },
  referral_1:            { name: "First Referral",      icon: "🤝" },
  referral_5:            { name: "Team Builder",        icon: "👥" },
  referral_10:           { name: "Growth Hacker",       icon: "🚀" },
  first_post:            { name: "First Post",          icon: "📝" },
  first_journey:         { name: "Storyteller",         icon: "📖" },
  community_contributor: { name: "Community Star",      icon: "⭐" },
  mentor:                { name: "Mentor",              icon: "🎓" },
};

export class ReferralService {
  // ─────────────────────────────────────────────────────────────────────────
  // Referral Code
  // ─────────────────────────────────────────────────────────────────────────

  generateCode(username: string): string {
    const suffix = crypto.randomBytes(3).toString("hex");
    return `${username.toUpperCase().slice(0, 6)}-${suffix}`;
  }

  async getMyCode(userId: string): Promise<{ code: string; link: string }> {
    const user = await User.findById(userId).select("username referralCode").lean();
    if (!user) throw Errors.notFound("User");

    const typedUser = user as unknown as { username: string; referralCode: string };
    let code = typedUser.referralCode;

    // Generate and persist if not yet set
    if (!code) {
      code = this.generateCode(typedUser.username);
      await User.updateOne({ _id: userId }, { referralCode: code });
    }

    return {
      code,
      link: `https://habitforge.app/invite/${code}`,
    };
  }

  async getStats(userId: string): Promise<{
    code: string;
    totalReferrals: number;
    referrals: IReferral[];
  }> {
    const { code } = await this.getMyCode(userId);
    const referrals = await Referral.find({ referrerId: userId })
      .populate("referredId", "username firstName lastName avatarUrl createdAt")
      .sort({ createdAt: -1 })
      .lean() as unknown as IReferral[];

    return {
      code,
      totalReferrals: referrals.length,
      referrals,
    };
  }

  async applyCode(
    referredUserId: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    // Check if user was already referred
    const alreadyReferred = await Referral.findOne({ referredId: referredUserId });
    if (alreadyReferred) {
      throw Errors.conflict("You have already applied a referral code");
    }

    // Find a referrer who uses this code
    // First check existing referrals with this code
    let referrerReferral = await Referral.findOne({ code }).lean();
    let referrerId: string;

    if (referrerReferral) {
      referrerId = referrerReferral.referrerId.toString();
    } else {
      // Look up user by their persisted referralCode
      const user = await User.findOne({ referralCode: code }).lean();
      if (!user) throw Errors.badRequest("Invalid referral code");
      referrerId = (user as unknown as { _id: { toString(): string } })._id.toString();
    }

    // Can't refer yourself
    if (referrerId === referredUserId) {
      throw Errors.badRequest("You cannot use your own referral code");
    }

    // Create referral record
    await Referral.create({
      referrerId,
      referredId: referredUserId,
      code,
      rewardClaimed: true,
    });

    // Reward both users with a streak shield (increment totalPoints by 100)
    await User.updateOne({ _id: referrerId }, { $inc: { totalPoints: 100 } });
    await User.updateOne({ _id: referredUserId }, { $inc: { totalPoints: 50 } });

    // Award "Mentor" badge to referrer
    await this.awardBadge(referrerId, "mentor");

    // Check referral count badges for referrer
    const referralCount = await Referral.countDocuments({ referrerId });
    if (referralCount >= 1) await this.awardBadge(referrerId, "referral_1");
    if (referralCount >= 5) await this.awardBadge(referrerId, "referral_5");
    if (referralCount >= 10) await this.awardBadge(referrerId, "referral_10");

    // Notify referrer
    await notifService.create({
      userId: referrerId,
      type: "system",
      fromUserId: referredUserId,
      text: "Someone joined using your referral code! You earned 100 points.",
    });

    return { success: true, message: "Referral applied! Both users rewarded." };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Badge System
  // ─────────────────────────────────────────────────────────────────────────

  async awardBadge(userId: string, type: BadgeType): Promise<IBadge | null> {
    const def = BADGE_DEFS[type];
    if (!def) return null;

    // Upsert: don't duplicate
    const existing = await Badge.findOne({ userId, type }).lean();
    if (existing) return existing as unknown as IBadge;

    const badge = await Badge.create({
      userId,
      type,
      name: def.name,
      icon: def.icon,
    });

    // Notify user
    await notifService.create({
      userId,
      type: "system",
      text: `You unlocked a new badge: ${def.icon} ${def.name}!`,
    });

    return badge;
  }

  async getMyBadges(userId: string): Promise<IBadge[]> {
    return Badge.find({ userId })
      .sort({ unlockedAt: -1 })
      .lean() as unknown as IBadge[];
  }

  async getAvailableBadges(userId: string): Promise<{
    badges: { type: BadgeType; name: string; icon: string; unlocked: boolean; progress?: string }[];
  }> {
    const myBadges = await Badge.find({ userId }).lean();
    const unlockedTypes = new Set(myBadges.map((b) => (b as unknown as IBadge).type));

    // Get progress data
    const streaks = await Streak.find({ userId }).lean();
    const maxStreak = streaks.reduce((max, s) => Math.max(max, (s as unknown as { longestStreak: number }).longestStreak), 0);
    const referralCount = await Referral.countDocuments({ referrerId: userId });

    const badges = (Object.entries(BADGE_DEFS) as [BadgeType, { name: string; icon: string }][]).map(
      ([type, def]) => {
        const unlocked = unlockedTypes.has(type);
        let progress: string | undefined;

        if (type === "streak_7") progress = `${Math.min(maxStreak, 7)}/7 days`;
        else if (type === "streak_30") progress = `${Math.min(maxStreak, 30)}/30 days`;
        else if (type === "streak_100") progress = `${Math.min(maxStreak, 100)}/100 days`;
        else if (type === "streak_365") progress = `${Math.min(maxStreak, 365)}/365 days`;
        else if (type === "referral_1") progress = `${Math.min(referralCount, 1)}/1 referrals`;
        else if (type === "referral_5") progress = `${Math.min(referralCount, 5)}/5 referrals`;
        else if (type === "referral_10") progress = `${Math.min(referralCount, 10)}/10 referrals`;

        return { type, name: def.name, icon: def.icon, unlocked, progress };
      }
    );

    return { badges };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Check & award streak badges (called after habit log)
  // ─────────────────────────────────────────────────────────────────────────

  async checkStreakBadges(userId: string): Promise<void> {
    const streaks = await Streak.find({ userId }).lean();
    const maxStreak = streaks.reduce(
      (max, s) => Math.max(max, (s as unknown as { longestStreak: number }).longestStreak),
      0
    );

    if (maxStreak >= 7) await this.awardBadge(userId, "streak_7");
    if (maxStreak >= 30) await this.awardBadge(userId, "streak_30");
    if (maxStreak >= 100) await this.awardBadge(userId, "streak_100");
    if (maxStreak >= 365) await this.awardBadge(userId, "streak_365");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Leaderboard
  // ─────────────────────────────────────────────────────────────────────────

  async getLeaderboard(
    period: "week" | "month" | "all",
    limit: number
  ): Promise<{ rank: number; userId: string; username: string; avatar: string | null; points: number; streak: number }[]> {
    // For "all" we use totalPoints from User model
    // For week/month we could use a separate calculation, but for now we use currentStreak + totalPoints
    const users = await User.find({ banned: false })
      .sort({ totalPoints: -1, currentStreak: -1 })
      .limit(limit)
      .select("username avatarUrl totalPoints currentStreak")
      .lean();

    return users.map((u, i) => {
      const user = u as unknown as {
        _id: { toString(): string };
        username: string;
        avatarUrl: string | null;
        totalPoints: number;
        currentStreak: number;
      };
      return {
        rank: i + 1,
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatarUrl,
        points: user.totalPoints,
        streak: user.currentStreak,
      };
    });
  }
}

export const referralService = new ReferralService();
