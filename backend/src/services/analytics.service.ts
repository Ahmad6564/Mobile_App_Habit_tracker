import { Habit } from "../models/Habit";
import { HabitLog } from "../models/HabitLog";
import { Streak } from "../models/Streak";
import { Task } from "../models/Task";
import { fmtDate, daysInMonth, parseDate } from "../utils/dateUtils";

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const pad = (n: number) => String(n).padStart(2, "0");

/** Format "YYYY-MM-DD" from parts */
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export class AnalyticsService {
  // ─────────────────────────────────────────────────────────────────────────
  // Calendar — per-day habit completion % + task counts
  // GET /api/calendar/:year/:month   (month is 1-indexed)
  // ─────────────────────────────────────────────────────────────────────────
  async getCalendarMonth(userId: string, year: number, month: number) {
    const numDays = daysInMonth(year, month - 1); // daysInMonth uses 0-indexed month
    const firstDay = ymd(year, month, 1);
    const lastDay = ymd(year, month, numDays);

    const [habits, logs, tasks] = await Promise.all([
      Habit.find({ userId, archived: false }).lean(),
      HabitLog.find({ userId, date: { $gte: firstDay, $lte: lastDay } }).lean(),
      Task.find({ userId, due: { $gte: firstDay, $lte: lastDay } }).lean(),
    ]);

    const calendar: Record<
      string,
      {
        completionPct: number;
        completedHabits: number;
        totalHabits: number;
        taskCount: number;
        taskDoneCount: number;
      }
    > = {};

    for (let d = 1; d <= numDays; d++) {
      const dateStr = ymd(year, month, d);
      const dayName = DAY_NAMES[parseDate(dateStr).getDay()];

      const scheduledHabits = habits.filter((h) => h.schedule.includes(dayName));
      const dayLogs = logs.filter((l) => l.date === dateStr);
      const completedHabits = dayLogs.filter((l) => l.completed).length;

      const dayTasks = tasks.filter((t) => t.due === dateStr);
      const doneTasks = dayTasks.filter((t) => t.done).length;

      calendar[dateStr] = {
        completionPct:
          scheduledHabits.length > 0
            ? Math.round((completedHabits / scheduledHabits.length) * 100)
            : 0,
        completedHabits,
        totalHabits: scheduledHabits.length,
        taskCount: dayTasks.length,
        taskDoneCount: doneTasks,
      };
    }

    return { year, month, days: numDays, calendar };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Weekly Review — current Mon→Sun window
  // GET /api/analytics/weekly
  // ─────────────────────────────────────────────────────────────────────────
  async getWeeklyReview(userId: string) {
    const now = new Date();
    const dow = now.getDay(); // 0=Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekStart = fmtDate(monday);
    const weekEnd = fmtDate(sunday);

    const [habits, logs, streaks] = await Promise.all([
      Habit.find({ userId, archived: false }).lean(),
      HabitLog.find({ userId, date: { $gte: weekStart, $lte: weekEnd } }).lean(),
      Streak.find({ userId }).lean(),
    ]);

    const streakMap: Record<string, number> = {};
    for (const s of streaks) streakMap[s.habitId.toString()] = s.currentStreak;

    const habitStats = habits.map((h) => {
      let scheduled = 0;
      let completed = 0;

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dayName = DAY_NAMES[d.getDay()];
        if (!h.schedule.includes(dayName)) continue;

        scheduled++;
        const dateStr = fmtDate(d);
        const log = logs.find(
          (l) => l.habitId.toString() === h._id.toString() && l.date === dateStr
        );
        if (log?.completed) completed++;
      }

      return {
        habitId: h._id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        scheduled,
        completed,
        rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
        currentStreak: streakMap[h._id.toString()] ?? 0,
      };
    });

    const totalScheduled = habitStats.reduce((s, h) => s + h.scheduled, 0);
    const totalCompleted = habitStats.reduce((s, h) => s + h.completed, 0);
    const wins = habitStats.filter((h) => h.scheduled > 0 && h.rate === 100);
    const misses = habitStats.filter((h) => h.scheduled > 0 && h.rate < 50);

    return {
      weekStart,
      weekEnd,
      consistencyScore:
        totalScheduled > 0
          ? Math.round((totalCompleted / totalScheduled) * 100)
          : 0,
      totalCompleted,
      totalScheduled,
      wins: wins.map((h) => ({ name: h.name, icon: h.icon, color: h.color })),
      misses: misses.map((h) => ({ name: h.name, icon: h.icon, color: h.color, rate: h.rate })),
      habitStats,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Monthly Report
  // GET /api/analytics/monthly/:year/:month   (month is 1-indexed)
  // ─────────────────────────────────────────────────────────────────────────
  async getMonthlyReport(userId: string, year: number, month: number) {
    const numDays = daysInMonth(year, month - 1);
    const firstDay = ymd(year, month, 1);
    const lastDay = ymd(year, month, numDays);

    const [habits, logs, streaks] = await Promise.all([
      Habit.find({ userId, archived: false }).lean(),
      HabitLog.find({ userId, date: { $gte: firstDay, $lte: lastDay } }).lean(),
      Streak.find({ userId }).lean(),
    ]);

    const streakMap: Record<string, { currentStreak: number; longestStreak: number }> = {};
    for (const s of streaks) {
      streakMap[s.habitId.toString()] = {
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
      };
    }

    const habitStats = habits.map((h) => {
      let scheduled = 0;
      for (let d = 1; d <= numDays; d++) {
        const date = new Date(year, month - 1, d);
        if (h.schedule.includes(DAY_NAMES[date.getDay()])) scheduled++;
      }

      const completedLogs = logs.filter(
        (l) => l.habitId.toString() === h._id.toString() && l.completed
      );

      const info = streakMap[h._id.toString()] ?? { currentStreak: 0, longestStreak: 0 };
      return {
        habitId: h._id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        scheduled,
        completed: completedLogs.length,
        rate: scheduled > 0 ? Math.round((completedLogs.length / scheduled) * 100) : 0,
        currentStreak: info.currentStreak,
        longestStreak: info.longestStreak,
      };
    });

    const sorted = [...habitStats].sort((a, b) => b.rate - a.rate);
    const totalScheduled = habitStats.reduce((s, h) => s + h.scheduled, 0);
    const totalCompleted = habitStats.reduce((s, h) => s + h.completed, 0);

    return {
      year,
      month,
      overallRate:
        totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
      totalCompleted,
      totalScheduled,
      strongestHabit: sorted[0] ?? null,
      weakestHabit: sorted[sorted.length - 1] ?? null,
      habitStats,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // All-Habits Streak Summary
  // GET /api/analytics/streaks
  // ─────────────────────────────────────────────────────────────────────────
  async getAllStreaks(userId: string) {
    const [habits, streaks] = await Promise.all([
      Habit.find({ userId, archived: false }).lean(),
      Streak.find({ userId }).lean(),
    ]);

    const streakMap: Record<string, (typeof streaks)[0]> = {};
    for (const s of streaks) streakMap[s.habitId.toString()] = s;

    return habits.map((h) => ({
      habitId: h._id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      currentStreak: streakMap[h._id.toString()]?.currentStreak ?? 0,
      longestStreak: streakMap[h._id.toString()]?.longestStreak ?? 0,
      lastLogDate: streakMap[h._id.toString()]?.lastLogDate ?? null,
    }));
  }
}
