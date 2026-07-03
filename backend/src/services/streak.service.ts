import { HabitLog } from "../models/HabitLog";
import { Streak, IStreak } from "../models/Streak";
import { fmtDate, today } from "../utils/dateUtils";

export class StreakService {
  /**
   * Recompute the current streak for a habit and persist to the Streak collection.
   * The algorithm mirrors the mobile frontend: walk backward from today, counting
   * every day that has a completed log; stop on the first gap.
   */
  async updateStreak(habitId: string, userId: string): Promise<IStreak> {
    const currentStreak = await this.computeCurrentStreak(habitId);

    const existing = await Streak.findOne({ habitId });
    if (!existing) {
      return Streak.create({
        habitId,
        userId,
        currentStreak,
        longestStreak: currentStreak,
        lastLogDate: currentStreak > 0 ? today() : null,
      });
    }

    existing.currentStreak = currentStreak;
    existing.longestStreak = Math.max(existing.longestStreak, currentStreak);
    if (currentStreak > 0) existing.lastLogDate = today();
    await existing.save();
    return existing;
  }

  /** Calculate current streak without writing to DB */
  async computeCurrentStreak(habitId: string): Promise<number> {
    const logs = await HabitLog.find({ habitId, completed: true })
      .select("date")
      .lean();

    if (!logs.length) return 0;

    const logSet = new Set(logs.map((l) => l.date));

    let streak = 0;
    const cursor = new Date();

    for (let i = 0; i <= 365; i++) {
      const key = fmtDate(cursor);
      if (logSet.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  async getStreak(habitId: string): Promise<IStreak | null> {
    return Streak.findOne({ habitId });
  }

  /** Returns true if the shield has never been used or was used 30+ days ago */
  canUseShield(streak: IStreak): boolean {
    if (!streak.shieldUsedAt) return true;
    const daysSince =
      (Date.now() - streak.shieldUsedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 30;
  }
}
