import { User } from "../models/User";
import { Habit } from "../models/Habit";
import { HabitLog } from "../models/HabitLog";
import { Task } from "../models/Task";
import { NotificationService } from "../services/notification.service";
import { fmtDate } from "../utils/dateUtils";
import { logger } from "../utils/logger";

const notifService = new NotificationService();

export class ReminderJobs {
  /**
   * Runs every hour.
   * Sends a habit reminder push to users whose `settings.reminderTime` hour
   * matches the current UTC hour AND who have incomplete habits today.
   */
  async sendHabitReminders(): Promise<void> {
    const nowHour = new Date().getUTCHours();
    const todayStr = fmtDate(new Date());
    const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
    const todayDay = DAY_NAMES[new Date().getDay()];

    try {
      // Find users whose reminder hour matches now and have notifications enabled
      const users = await User.find({
        "settings.notifications": true,
        "settings.reminderTime": { $regex: `^${String(nowHour).padStart(2, "0")}:` },
      })
        .select("_id")
        .lean();

      for (const user of users) {
        const userId = user._id.toString();
        try {
          const habits = await Habit.find({ userId, archived: false, schedule: todayDay }).lean();
          if (!habits.length) continue;

          const logs = await HabitLog.find({
            userId,
            date: todayStr,
            habitId: { $in: habits.map((h) => h._id) },
            completed: true,
          }).lean();

          const completedIds = new Set(logs.map((l) => l.habitId.toString()));
          const incomplete = habits.filter((h) => !completedIds.has(h._id.toString()));

          if (!incomplete.length) continue;

          const names = incomplete.slice(0, 3).map((h) => h.name).join(", ");
          const extra = incomplete.length > 3 ? ` +${incomplete.length - 3} more` : "";

          await notifService.createSilent({
            userId,
            type: "reminder",
            text: `Don't forget your habits today: ${names}${extra}`,
          });
        } catch (err) {
          logger.warn(`Habit reminder failed for user ${userId}`, { err });
        }
      }
    } catch (err) {
      logger.error("sendHabitReminders cron error", { err });
    }
  }

  /**
   * Runs once daily at 08:00 UTC.
   * Notifies users about tasks due today.
   */
  async sendTaskDueReminders(): Promise<void> {
    const todayStr = fmtDate(new Date());

    try {
      // Find all tasks due today that are not done
      const tasks = await Task.find({ due: todayStr, done: false }).lean();

      // Group by userId
      const byUser: Record<string, typeof tasks> = {};
      for (const t of tasks) {
        const uid = t.userId.toString();
        if (!byUser[uid]) byUser[uid] = [];
        byUser[uid].push(t);
      }

      for (const [userId, userTasks] of Object.entries(byUser)) {
        try {
          const user = await User.findById(userId)
            .select("settings")
            .lean();
          if (!user?.settings?.notifications) continue;

          const names = userTasks.slice(0, 3).map((t) => t.title).join(", ");
          const extra = userTasks.length > 3 ? ` +${userTasks.length - 3} more` : "";

          await notifService.createSilent({
            userId,
            type: "reminder",
            text: `You have tasks due today: ${names}${extra}`,
          });
        } catch (err) {
          logger.warn(`Task reminder failed for user ${userId}`, { err });
        }
      }
    } catch (err) {
      logger.error("sendTaskDueReminders cron error", { err });
    }
  }
}
