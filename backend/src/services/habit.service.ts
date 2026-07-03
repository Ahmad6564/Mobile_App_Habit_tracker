import { Habit, IHabit } from "../models/Habit";
import { HabitLog, IHabitLog } from "../models/HabitLog";
import { Streak, IStreak } from "../models/Streak";
import { StreakService } from "./streak.service";
import { AppError, Errors } from "../utils/AppError";
import { fmtDate, today, parseDate, daysInMonth } from "../utils/dateUtils";

const streakSvc = new StreakService();

/** Maximum days in the past a user may log */
const MAX_BACKLOG_DAYS = 7;

// ─── Preset library (returned by GET /habits/presets) ──────────────────────
const HABIT_PRESETS = [
  { name: "Morning Run",    icon: "run",     goal: 1,  unit: "session", category: "Fitness", color: "#f97316", schedule: ["mon","tue","wed","thu","fri","sat","sun"] },
  { name: "Meditation",     icon: "meditate",goal: 1,  unit: "session", category: "Mind",    color: "#8b5cf6", schedule: ["mon","tue","wed","thu","fri","sat","sun"] },
  { name: "Drink 2L Water", icon: "water",   goal: 8,  unit: "glasses", category: "Health",  color: "#22d3ee", schedule: ["mon","tue","wed","thu","fri","sat","sun"] },
  { name: "Read",           icon: "book",    goal: 20, unit: "pages",   category: "Growth",  color: "#f59e0b", schedule: ["mon","tue","wed","thu","fri","sat","sun"] },
  { name: "Stretching",     icon: "stretch", goal: 1,  unit: "session", category: "Fitness", color: "#10b981", schedule: ["mon","tue","wed","thu","fri","sat","sun"] },
  { name: "No Sugar",       icon: "shield",  goal: 1,  unit: "day",     category: "Diet",    color: "#ef4444", schedule: ["mon","tue","wed","thu","fri","sat","sun"] },
  { name: "Journaling",     icon: "pencil",  goal: 1,  unit: "entry",   category: "Mind",    color: "#ec4899", schedule: ["mon","tue","wed","thu","fri","sat","sun"] },
  { name: "Cold Shower",    icon: "droplets",goal: 1,  unit: "session", category: "Health",  color: "#06b6d4", schedule: ["mon","tue","wed","thu","fri","sat","sun"] },
];

export class HabitService {
  // ─────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────

  async createHabit(
    userId: string,
    data: {
      name: string;
      icon?: string;
      goal: number;
      unit?: string;
      category?: string;
      color?: string;
      schedule?: string[];
    }
  ): Promise<IHabit & { streak: IStreak }> {
    const habit = await Habit.create({ userId, ...data });
    const streak = await Streak.create({
      habitId: habit._id,
      userId,
      currentStreak: 0,
      longestStreak: 0,
    });
    return { ...habit.toObject(), streak } as unknown as IHabit & { streak: IStreak };
  }

  async updateHabit(
    userId: string,
    habitId: string,
    data: Partial<Pick<IHabit, "name" | "icon" | "goal" | "unit" | "category" | "color" | "schedule">>
  ): Promise<IHabit> {
    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!habit) throw Errors.notFound("Habit");
    return habit;
  }

  async archiveHabit(userId: string, habitId: string): Promise<void> {
    const result = await Habit.findOneAndUpdate(
      { _id: habitId, userId, archived: false },
      { archived: true, archivedAt: new Date() }
    );
    if (!result) throw Errors.notFound("Habit");
  }

  async restoreHabit(userId: string, habitId: string): Promise<IHabit> {
    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, userId, archived: true },
      { archived: false, archivedAt: null },
      { new: true }
    );
    if (!habit) throw Errors.notFound("Habit");
    return habit;
  }

  async listHabits(userId: string): Promise<(IHabit & { streak: IStreak | null })[]> {
    const habits = await Habit.find({ userId, archived: false }).sort({ createdAt: 1 }).lean();
    const streaks = await Streak.find({ userId }).lean();
    const streakMap: Record<string, IStreak> = {};
    for (const s of streaks) streakMap[s.habitId.toString()] = s as unknown as IStreak;

    return habits.map((h) => ({
      ...h,
      streak: streakMap[h._id.toString()] ?? null,
    })) as unknown as (IHabit & { streak: IStreak | null })[];
  }

  async listArchivedHabits(userId: string): Promise<IHabit[]> {
    return Habit.find({ userId, archived: true }).sort({ archivedAt: -1 }).lean() as unknown as Promise<IHabit[]>;
  }

  async getHabit(userId: string, habitId: string): Promise<IHabit & { streak: IStreak | null }> {
    const habit = await Habit.findOne({ _id: habitId, userId }).lean();
    if (!habit) throw Errors.notFound("Habit");
    const streak = (await Streak.findOne({ habitId }).lean()) as IStreak | null;
    return { ...habit, streak } as unknown as IHabit & { streak: IStreak | null };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Logging
  // ─────────────────────────────────────────────────────────────────────────

  async logHabit(
    userId: string,
    habitId: string,
    data: { date: string; value: number; note?: string; mood?: string }
  ): Promise<{ log: IHabitLog; streak: IStreak }> {
    const habit = await Habit.findOne({ _id: habitId, userId, archived: false });
    if (!habit) throw Errors.notFound("Habit");

    // Enforce back-log window
    const logDate = parseDate(data.date);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (todayMidnight.getTime() - logDate.getTime()) / 86_400_000
    );
    if (diffDays > MAX_BACKLOG_DAYS) {
      throw new AppError(
        `Cannot log more than ${MAX_BACKLOG_DAYS} days in the past`,
        422,
        "BACKLOG_LIMIT"
      );
    }
    if (diffDays < 0) {
      throw new AppError("Cannot log a future date", 422, "FUTURE_DATE");
    }

    const completed = data.value >= habit.goal;

    const log = await HabitLog.findOneAndUpdate(
      { habitId, date: data.date },
      {
        $set: {
          habitId,
          userId,
          date: data.date,
          value: data.value,
          completed,
          note: data.note ?? "",
          mood: data.mood ?? "",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const streak = await streakSvc.updateStreak(habitId, userId);
    return { log: log as IHabitLog, streak };
  }

  async removeLog(userId: string, habitId: string, date: string): Promise<IStreak> {
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) throw Errors.notFound("Habit");

    await HabitLog.deleteOne({ habitId, userId, date });
    return streakSvc.updateStreak(habitId, userId);
  }

  async getLogs(
    userId: string,
    habitId: string,
    from: string,
    to: string
  ): Promise<IHabitLog[]> {
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) throw Errors.notFound("Habit");
    return HabitLog.find({ habitId, userId, date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean() as unknown as Promise<IHabitLog[]>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Analytics & Matrix
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns a month-grid for all active habits.
   * month is 0-indexed (January = 0), matching JS Date.
   */
  async getMatrix(userId: string, year: number, month: number): Promise<unknown> {
    const habits = await Habit.find({ userId, archived: false })
      .sort({ createdAt: 1 })
      .lean();

    const numDays = daysInMonth(year, month);
    const pad = (n: number) => String(n).padStart(2, "0");
    const days: string[] = Array.from(
      { length: numDays },
      (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`
    );

    const logs = await HabitLog.find({
      userId,
      date: { $gte: days[0], $lte: days[numDays - 1] },
    }).lean();

    // Build index: habitId → date → { value, completed }
    const logIdx: Record<string, Record<string, { value: number; completed: boolean }>> = {};
    for (const l of logs) {
      const hid = l.habitId.toString();
      if (!logIdx[hid]) logIdx[hid] = {};
      logIdx[hid][l.date] = { value: l.value, completed: l.completed };
    }

    const habitRows = habits.map((h) => ({
      id:    h._id,
      name:  h.name,
      icon:  h.icon,
      color: h.color,
      goal:  h.goal,
      unit:  h.unit,
      logs: Object.fromEntries(
        days.map((d) => [
          d,
          logIdx[h._id.toString()]?.[d] ?? { value: 0, completed: false },
        ])
      ),
    }));

    return { year, month, days, habits: habitRows };
  }

  /** Dashboard quick-stats for the authenticated user */
  async getDashboardSummary(userId: string): Promise<unknown> {
    const todayStr = today();
    const now = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const numDays = daysInMonth(year, month);
    const pad = (n: number) => String(n).padStart(2, "0");

    const habits = await Habit.find({ userId, archived: false }).lean();

    // Today's logs
    const todayLogs = await HabitLog.find({ userId, date: todayStr }).lean();
    const todayLogMap: Record<string, boolean> = {};
    for (const l of todayLogs) todayLogMap[l.habitId.toString()] = l.completed;

    const todayDone  = habits.filter((h) => todayLogMap[h._id.toString()]).length;
    const todayTotal = habits.length;

    // Month completion rate
    const monthStart = `${year}-${pad(month + 1)}-01`;
    const monthEnd   = `${year}-${pad(month + 1)}-${pad(numDays)}`;
    const [completedThisMonth] = await Promise.all([
      HabitLog.countDocuments({
        userId,
        date: { $gte: monthStart, $lte: monthEnd },
        completed: true,
      }),
    ]);
    const totalGoalDays = habits.length * numDays;
    const monthAvgPct = totalGoalDays > 0
      ? Math.round((completedThisMonth / totalGoalDays) * 100)
      : 0;

    // Streaks
    const streaks = await Streak.find({ userId }).lean();
    const streakMap: Record<string, number> = {};
    let longestActiveStreak = 0;
    for (const s of streaks) {
      streakMap[s.habitId.toString()] = s.currentStreak;
      longestActiveStreak = Math.max(longestActiveStreak, s.currentStreak);
    }

    const topHabits = habits
      .map((h) => ({
        id:            h._id,
        name:          h.name,
        icon:          h.icon,
        color:         h.color,
        currentStreak: streakMap[h._id.toString()] ?? 0,
      }))
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 5);

    return {
      todayDone,
      todayTotal,
      todayPct: todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0,
      monthAvgPct,
      longestActiveStreak,
      topHabits,
    };
  }

  async getAnalytics(userId: string, habitId: string): Promise<unknown> {
    const habit = await Habit.findOne({ _id: habitId, userId }).lean();
    if (!habit) throw Errors.notFound("Habit");

    const now = new Date();
    const from = new Date(now.getTime() - 89 * 86_400_000);
    const fromStr = fmtDate(from);
    const toStr   = today();

    const logs = await HabitLog.find({
      habitId,
      date: { $gte: fromStr, $lte: toStr },
    }).lean();

    const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date));
    const streak = await Streak.findOne({ habitId }).lean();

    // Last 12 full weeks
    const weeks = Array.from({ length: 12 }, (_, wi) => {
      // wi=0 → oldest week, wi=11 → most recent
      const weeksAgo = 11 - wi;
      const wStart = new Date(now.getTime() - (weeksAgo * 7 + 6) * 86_400_000);
      const wEnd   = new Date(now.getTime() - weeksAgo * 7 * 86_400_000);
      let completed = 0;
      let total = 0;
      const cursor = new Date(wStart);
      while (cursor <= wEnd) {
        total++;
        if (completedSet.has(fmtDate(cursor))) completed++;
        cursor.setDate(cursor.getDate() + 1);
      }
      return {
        week: fmtDate(wStart),
        completed,
        total,
        pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    const heatmap: Record<string, number> = {};
    for (const l of logs) heatmap[l.date] = l.value;

    const totalCompleted  = completedSet.size;
    const totalScheduled  = 90;
    const completionRate  = Math.round((totalCompleted / totalScheduled) * 100);

    return {
      habit: {
        id:       habit._id,
        name:     habit.name,
        icon:     habit.icon,
        color:    habit.color,
        goal:     habit.goal,
        unit:     habit.unit,
        schedule: habit.schedule,
      },
      currentStreak:  streak?.currentStreak  ?? 0,
      longestStreak:  streak?.longestStreak  ?? 0,
      totalCompleted,
      completionRate,
      weeklyBreakdown: weeks,
      heatmap,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Streak Shield
  // ─────────────────────────────────────────────────────────────────────────

  async useStreakShield(userId: string, habitId: string): Promise<IStreak> {
    const habit = await Habit.findOne({ _id: habitId, userId, archived: false });
    if (!habit) throw Errors.notFound("Habit");

    const streak = await Streak.findOne({ habitId });
    if (!streak) throw Errors.notFound("Streak record");

    if (!streakSvc.canUseShield(streak)) {
      throw new AppError(
        "Streak shield is on cooldown — wait 30 days between uses",
        422,
        "SHIELD_COOLDOWN"
      );
    }

    // Log today as completed with goal value (shield counts as a full completion)
    const todayStr = today();
    await HabitLog.findOneAndUpdate(
      { habitId, date: todayStr },
      {
        $set: {
          habitId,
          userId,
          date: todayStr,
          value: habit.goal,
          completed: true,
          note: "Streak shield used",
          mood: "",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    streak.shieldUsedAt = new Date();
    await streak.save();

    return streakSvc.updateStreak(habitId, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Presets
  // ─────────────────────────────────────────────────────────────────────────

  getPresets(): typeof HABIT_PRESETS {
    return HABIT_PRESETS;
  }
}
