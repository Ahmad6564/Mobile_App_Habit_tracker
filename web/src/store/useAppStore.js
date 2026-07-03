/**
 * HabitForge Web App Store (API-backed)
 *
 * Replaces the old localStorage-only store with real backend API calls.
 * UI-only state (theme, viewMonth, coach/nutrition chats) still uses localStorage.
 * All habit/task/profile data comes from the backend.
 */
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { habitsApi } from "../api/habits";
import { tasksApi } from "../api/tasks";
import { usersApi } from "../api/users";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UI_STORAGE_KEY = "habitforge.ui.v1";

const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const today = () => fmt(new Date());

const PALETTE = [
  "#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24",
  "#fb7185", "#60a5fa", "#f59e0b", "#c084fc"
];

function loadUiState() {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUiState(state) {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAppStore() {
  // ── UI-only state (persisted locally) ───────────────────────────────────
  const [uiState, setUiState] = useState(() => {
    const cached = loadUiState();
    const now = new Date();
    return {
      viewYear: cached.viewYear ?? now.getFullYear(),
      viewMonth: cached.viewMonth ?? now.getMonth(),
      settings: {
        theme: cached.settings?.theme || "dark",
        notifications: cached.settings?.notifications ?? false,
        reminderTime: cached.settings?.reminderTime || "21:30",
        calorieTarget: cached.settings?.calorieTarget || 2200,
      },
      coachChats: cached.coachChats || [],
      coachActiveId: cached.coachActiveId || null,
      nutritionChats: cached.nutritionChats || [],
      nutritionActiveId: cached.nutritionActiveId || null,
      search: "",
    };
  });

  // ── API-backed state ────────────────────────────────────────────────────
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState({
    name: "", username: "", dob: "", gender: "", country: "",
    timezone: "", bio: "", referralCode: "",
  });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Persist UI state
  useEffect(() => { saveUiState(uiState); }, [uiState]);

  // Apply theme
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = uiState.settings.theme;
    }
  }, [uiState.settings.theme]);

  // ── Initial data load ───────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [habitsData, tasksResult, userData] = await Promise.all([
        habitsApi.list(),
        tasksApi.list(),
        usersApi.getMe(),
      ]);
      if (!mountedRef.current) return;
      setHabits(habitsData || []);
      setTasks(tasksResult.tasks || []);
      setProfile({
        name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        username: userData.username || "",
        dob: userData.dateOfBirth || "",
        gender: userData.gender || "",
        country: "",
        timezone: userData.timezone || "",
        bio: userData.bio || "",
        referralCode: userData.referralCode || "",
        avatarUrl: userData.avatarUrl || null,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || "Failed to load data");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Habits ──────────────────────────────────────────────────────────────

  const addHabit = useCallback(async (payload) => {
    try {
      const data = await habitsApi.create({
        name: payload.name?.trim(),
        icon: payload.icon || "✨",
        goal: Number(payload.goal) || 1,
        unit: payload.unit || "times",
        category: payload.category || "General",
        color: payload.color || PALETTE[habits.length % PALETTE.length],
        schedule: payload.schedule,
      });
      const habit = data.habit || data;
      setHabits((prev) => [habit, ...prev]);
      return habit;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [habits.length]);

  const updateHabit = useCallback(async (id, patch) => {
    try {
      const updated = await habitsApi.update(id, patch);
      setHabits((prev) => prev.map((h) => ((h._id || h.id) === id ? { ...h, ...updated } : h)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteHabit = useCallback(async (id) => {
    try {
      await habitsApi.archive(id);
      setHabits((prev) => prev.filter((h) => (h._id || h.id) !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const toggleHabit = useCallback(async (id, date = today()) => {
    const habit = habits.find((h) => (h._id || h.id) === id);
    if (!habit) return;
    const hid = habit._id || habit.id;
    const goal = habit.goal || 1;
    const currentLog = habit.logs?.[date] || 0;

    try {
      if (currentLog >= goal) {
        await habitsApi.deleteLog(hid, date);
        setHabits((prev) => prev.map((h) => {
          if ((h._id || h.id) !== id) return h;
          const logs = { ...(h.logs || {}) };
          delete logs[date];
          return { ...h, logs };
        }));
      } else {
        const result = await habitsApi.log(hid, { date, value: goal });
        setHabits((prev) => prev.map((h) => {
          if ((h._id || h.id) !== id) return h;
          const logs = { ...(h.logs || {}), [date]: goal };
          return { ...h, logs, streak: result.streak || h.streak };
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  }, [habits]);

  const setHabitProgress = useCallback(async (id, date, value) => {
    const habit = habits.find((h) => (h._id || h.id) === id);
    if (!habit) return;
    const hid = habit._id || habit.id;
    const val = Math.max(0, value);

    try {
      if (val === 0) {
        await habitsApi.deleteLog(hid, date);
        setHabits((prev) => prev.map((h) => {
          if ((h._id || h.id) !== id) return h;
          const logs = { ...(h.logs || {}) };
          delete logs[date];
          return { ...h, logs };
        }));
      } else {
        const result = await habitsApi.log(hid, { date, value: val });
        setHabits((prev) => prev.map((h) => {
          if ((h._id || h.id) !== id) return h;
          const logs = { ...(h.logs || {}), [date]: val };
          return { ...h, logs, streak: result.streak || h.streak };
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  }, [habits]);

  // ── Tasks ───────────────────────────────────────────────────────────────

  const addTask = useCallback(async (payload) => {
    try {
      const task = await tasksApi.create({
        title: payload.title?.trim(),
        notes: payload.notes || "",
        due: payload.due || null,
        priority: payload.priority || "medium",
      });
      setTasks((prev) => [task, ...prev]);
      return task;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const toggleTask = useCallback(async (id) => {
    try {
      const updated = await tasksApi.toggle(id);
      setTasks((prev) => prev.map((t) => ((t._id || t.id) === id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await tasksApi.remove(id);
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ── Month navigation (UI only) ─────────────────────────────────────────

  const goToMonth = useCallback((year, month) => {
    setUiState((prev) => ({ ...prev, viewYear: year, viewMonth: month }));
  }, []);

  const goPrevMonth = useCallback(() => {
    setUiState((prev) => {
      let y = prev.viewYear, m = prev.viewMonth - 1;
      if (m < 0) { m = 11; y -= 1; }
      return { ...prev, viewYear: y, viewMonth: m };
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setUiState((prev) => {
      let y = prev.viewYear, m = prev.viewMonth + 1;
      if (m > 11) { m = 0; y += 1; }
      return { ...prev, viewYear: y, viewMonth: m };
    });
  }, []);

  const goThisMonth = useCallback(() => {
    const now = new Date();
    setUiState((prev) => ({ ...prev, viewYear: now.getFullYear(), viewMonth: now.getMonth() }));
  }, []);

  // ── Community (local until backend supports posts) ──────────────────────

  const addPost = useCallback((payload) => {
    setPosts((prev) => [{
      id: `p-${Date.now()}`, kind: payload.kind || "post",
      user: payload.user || "You", avatar: payload.avatar || "🧑",
      image: payload.image || "", caption: payload.caption || "",
      tags: payload.tags || [], likes: 0, liked: false, reposts: 0, saved: false,
      createdAt: today(), comments: [],
    }, ...prev]);
  }, []);

  const togglePostLike = useCallback((id) => {
    setPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
    ));
  }, []);

  const togglePostSave = useCallback((id) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
  }, []);

  const repostPost = useCallback((id) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, reposts: p.reposts + 1 } : p));
  }, []);

  const addComment = useCallback((id, text) => {
    if (!text?.trim()) return;
    setPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, comments: [...p.comments, { id: `c-${Date.now()}`, user: "You", text: text.trim() }] } : p
    ));
  }, []);

  const deleteComment = useCallback((postId, commentId) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
    ));
  }, []);

  // ── Profile / Settings ──────────────────────────────────────────────────

  const updateProfile = useCallback(async (patch) => {
    try {
      const apiPatch = {};
      if (patch.username) apiPatch.username = patch.username;
      if (patch.bio !== undefined) apiPatch.bio = patch.bio;
      if (patch.timezone) apiPatch.timezone = patch.timezone;
      if (patch.avatarUrl !== undefined) apiPatch.avatarUrl = patch.avatarUrl;
      if (Object.keys(apiPatch).length > 0) {
        await usersApi.updateProfile(apiPatch);
      }
      setProfile((prev) => ({ ...prev, ...patch }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateSettings = useCallback((patch) => {
    setUiState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const setTheme = useCallback((theme) => {
    setUiState((prev) => ({ ...prev, settings: { ...prev.settings, theme } }));
  }, []);

  const toggleTheme = useCallback(() => {
    setUiState((prev) => ({
      ...prev, settings: { ...prev.settings, theme: prev.settings.theme === "dark" ? "light" : "dark" }
    }));
  }, []);

  const setSearch = useCallback((q) => {
    setUiState((prev) => ({ ...prev, search: q }));
  }, []);

  // ── Coach chat (local rule-based AI) ────────────────────────────────────

  const newCoachChat = useCallback(() => {
    setUiState((prev) => {
      const id = `cc-${Date.now()}`;
      return { ...prev, coachChats: [{ id, title: "New chat", messages: [], createdAt: Date.now() }, ...prev.coachChats], coachActiveId: id };
    });
  }, []);

  const selectCoachChat = useCallback((id) => {
    setUiState((prev) => ({ ...prev, coachActiveId: id }));
  }, []);

  const deleteCoachChat = useCallback((id) => {
    setUiState((prev) => {
      const chats = prev.coachChats.filter((c) => c.id !== id);
      return { ...prev, coachChats: chats, coachActiveId: prev.coachActiveId === id ? (chats[0]?.id || null) : prev.coachActiveId };
    });
  }, []);

  const sendCoachMessage = useCallback((text) => {
    if (!text?.trim()) return;
    setUiState((prev) => {
      let activeId = prev.coachActiveId;
      let chats = [...prev.coachChats];
      if (!activeId || !chats.find((c) => c.id === activeId)) {
        activeId = `cc-${Date.now()}`;
        chats = [{ id: activeId, title: "New chat", messages: [], createdAt: Date.now() }, ...chats];
      }
      const userMsg = { id: `m-${Date.now()}`, role: "user", text: text.trim(), ts: Date.now() };
      const reply = buildCoachReply(text, { habits, tasks, profile, settings: prev.settings });
      const botMsg = { id: `m-${Date.now() + 1}`, role: "coach", text: reply, ts: Date.now() + 1 };
      chats = chats.map((c) => {
        if (c.id !== activeId) return c;
        const msgs = [...c.messages, userMsg, botMsg];
        const title = c.messages.length === 0 ? text.trim().slice(0, 40) : c.title;
        return { ...c, messages: msgs, title };
      });
      return { ...prev, coachChats: chats, coachActiveId: activeId };
    });
  }, [habits, tasks, profile]);

  // ── Nutrition chat (local rule-based AI) ────────────────────────────────

  const newNutritionChat = useCallback(() => {
    setUiState((prev) => {
      const id = `nc-${Date.now()}`;
      return { ...prev, nutritionChats: [{ id, title: "New chat", messages: [], createdAt: Date.now() }, ...prev.nutritionChats], nutritionActiveId: id };
    });
  }, []);

  const selectNutritionChat = useCallback((id) => {
    setUiState((prev) => ({ ...prev, nutritionActiveId: id }));
  }, []);

  const deleteNutritionChat = useCallback((id) => {
    setUiState((prev) => {
      const chats = prev.nutritionChats.filter((c) => c.id !== id);
      return { ...prev, nutritionChats: chats, nutritionActiveId: prev.nutritionActiveId === id ? (chats[0]?.id || null) : prev.nutritionActiveId };
    });
  }, []);

  const sendNutritionMessage = useCallback((text) => {
    if (!text?.trim()) return;
    setUiState((prev) => {
      let activeId = prev.nutritionActiveId;
      let chats = [...prev.nutritionChats];
      if (!activeId || !chats.find((c) => c.id === activeId)) {
        activeId = `nc-${Date.now()}`;
        chats = [{ id: activeId, title: "New chat", messages: [], createdAt: Date.now() }, ...chats];
      }
      const userMsg = { id: `m-${Date.now()}`, role: "user", text: text.trim(), ts: Date.now() };
      const reply = buildNutritionReply(text, { settings: prev.settings });
      const botMsg = { id: `m-${Date.now() + 1}`, role: "coach", text: reply, ts: Date.now() + 1 };
      chats = chats.map((c) => {
        if (c.id !== activeId) return c;
        const msgs = [...c.messages, userMsg, botMsg];
        const title = c.messages.length === 0 ? text.trim().slice(0, 40) : c.title;
        return { ...c, messages: msgs, title };
      });
      return { ...prev, nutritionChats: chats, nutritionActiveId: activeId };
    });
  }, []);

  const sendChat = useCallback((text) => sendCoachMessage(text), [sendCoachMessage]);
  const clearChat = useCallback(() => {}, []);

  // ── Stats ───────────────────────────────────────────────────────────────

  const stats = useMemo(
    () => computeStats(habits, tasks, uiState.viewYear, uiState.viewMonth),
    [habits, tasks, uiState.viewYear, uiState.viewMonth]
  );

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return uiState.viewYear === now.getFullYear() && uiState.viewMonth === now.getMonth();
  }, [uiState.viewYear, uiState.viewMonth]);

  return {
    habits, tasks, posts,
    viewYear: uiState.viewYear, viewMonth: uiState.viewMonth, isCurrentMonth,
    stats, profile, settings: uiState.settings,
    chat: [], coachChats: uiState.coachChats, coachActiveId: uiState.coachActiveId,
    nutritionChats: uiState.nutritionChats, nutritionActiveId: uiState.nutritionActiveId,
    search: uiState.search, loading, error,
    refreshData: fetchAll,
    addHabit, updateHabit, deleteHabit, toggleHabit, setHabitProgress,
    addTask, toggleTask, deleteTask,
    goToMonth, goPrevMonth, goNextMonth, goThisMonth,
    addPost, togglePostLike, togglePostSave, repostPost, addComment, deleteComment,
    updateProfile, updateSettings, setTheme, toggleTheme, setSearch,
    sendChat, clearChat,
    newCoachChat, selectCoachChat, deleteCoachChat, sendCoachMessage,
    newNutritionChat, selectNutritionChat, deleteNutritionChat, sendNutritionMessage,
  };
}

// ─── Stats computation ───────────────────────────────────────────────────────

function computeStats(habits, tasks, year, month) {
  const monthDates = getMonthDates(year, month);
  const weeks = chunkWeeks(monthDates);
  const todayKey = today();

  const dailyPercent = monthDates.map((d) => {
    if (!habits.length) return 0;
    const totalGoal = habits.reduce((sum, h) => sum + (h.goal || 1), 0);
    const totalDone = habits.reduce((sum, h) => sum + Math.min(h.goal || 1, h.logs?.[d] || 0), 0);
    return totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;
  });

  const todayInMonth = monthDates.includes(todayKey);
  const refKey = todayInMonth ? todayKey : monthDates[monthDates.length - 1];
  const refGoal = habits.reduce((sum, h) => sum + (h.goal || 1), 0);
  const refDone = habits.reduce((sum, h) => sum + Math.min(h.goal || 1, h.logs?.[refKey] || 0), 0);
  const overallPercent = refGoal ? Math.round((refDone / refGoal) * 100) : 0;

  const todayHabitsDone = habits.filter((h) => (h.logs?.[refKey] || 0) >= (h.goal || 1)).length;
  const todayTasksDone = (tasks || []).filter((t) => t.done).length;
  const todayItemsDone = todayHabitsDone + todayTasksDone;
  const todayItemsTotal = habits.length + (tasks || []).length;

  const monthTotalGoal = habits.reduce((s, h) => s + (h.goal || 1), 0) * monthDates.length;
  const monthTotalDone = habits.reduce(
    (s, h) => s + monthDates.reduce((a, d) => a + Math.min(h.goal || 1, h.logs?.[d] || 0), 0), 0
  );

  const monthAvg = dailyPercent.length
    ? Math.round(dailyPercent.reduce((a, b) => a + b, 0) / dailyPercent.length) : 0;

  const top = habits
    .map((h) => {
      const monthLogs = monthDates.map((d) => Math.min(h.goal || 1, h.logs?.[d] || 0)).reduce((a, b) => a + b, 0);
      const expected = monthDates.filter((d) => d <= todayKey).length * (h.goal || 1);
      const pct = expected ? Math.round((monthLogs / expected) * 100) : 0;
      return { id: h._id || h.id, name: h.name, icon: h.icon, color: h.color, pct, total: monthLogs };
    })
    .sort((a, b) => b.pct - a.pct).slice(0, 10);

  const weekStats = weeks.map((days) => {
    const realDays = days.filter(Boolean);
    let totalGoal = 0, totalDone = 0, fullChecks = 0, possibleChecks = 0;
    realDays.forEach((d) => {
      habits.forEach((h) => {
        totalGoal += h.goal || 1;
        possibleChecks += 1;
        const v = Math.min(h.goal || 1, h.logs?.[d] || 0);
        totalDone += v;
        if (v >= (h.goal || 1)) fullChecks += 1;
      });
    });
    const pct = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;
    return { days, realDays, totalGoal, totalDone, fullChecks, possibleChecks, pct };
  });

  return {
    dailyPercent, monthDates, weeks, weekStats, overallPercent, monthAvg,
    refKey, refDone, refGoal, todayInMonth, top,
    todayItemsDone, todayItemsTotal, todayHabitsDone, todayTasksDone,
    monthTotalGoal, monthTotalDone,
  };
}

function getMonthDates(year, month) {
  const last = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: last }, (_, i) => fmt(new Date(year, month, i + 1)));
}

function chunkWeeks(dates) {
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) weeks.push(dates.slice(i, i + 7));
  return weeks;
}

export function computeStreak(habit) {
  if (!habit?.logs) return 0;
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i += 1) {
    const key = fmt(d);
    if ((habit.logs[key] || 0) >= (habit.goal || 1)) streak += 1;
    else if (i !== 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export { today, fmt, PALETTE };

// ─── Coach AI (rule-based) ───────────────────────────────────────────────────

function buildCoachReply(input, state) {
  const q = input.toLowerCase();
  const habits = state.habits || [];
  const tasks = state.tasks || [];
  const todayKey = today();
  const totalGoal = habits.reduce((s, h) => s + (h.goal || 1), 0);
  const totalDone = habits.reduce((s, h) => s + Math.min(h.goal || 1, h.logs?.[todayKey] || 0), 0);
  const pct = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;
  const open = tasks.filter((t) => !t.done);
  const dueToday = tasks.filter((t) => !t.done && t.due === todayKey);

  const lines = [];
  if (/water|hydrat/.test(q)) {
    const water = habits.find((h) => /water|hydrat/i.test(h.name));
    if (water) {
      lines.push(`Today: ${water.logs?.[todayKey] || 0}/${water.goal} ${water.unit} for ${water.name}.`);
      lines.push("Tip: keep a bottle on your desk and refill it twice in the morning, twice in the afternoon.");
    } else {
      lines.push("You don't have a water habit yet. Add one with a goal of 8 glasses/day.");
    }
  } else if (/streak|consistent|how am i/.test(q)) {
    lines.push(`Today: ${totalDone}/${totalGoal} units done (${pct}%).`);
  } else if (/task|deadline|due/.test(q)) {
    lines.push(`You have ${open.length} open task(s). ${dueToday.length} due today.`);
  } else if (/improve|better|advice|coach|help/.test(q)) {
    lines.push(`Snapshot — Today ${pct}% done, ${open.length} open task(s).`);
    lines.push("Stack your weakest habit after an existing routine and set a 21:30 reminder.");
  } else {
    lines.push(`Today: ${totalDone}/${totalGoal} units (${pct}%), ${dueToday.length} task(s) due.`);
    lines.push("Try: 'how is my streak?' · 'what should I focus on?' · 'tips for water habit'");
  }
  return lines.join("\n\n");
}

function buildNutritionReply(input, state) {
  const q = input.toLowerCase();
  const target = state.settings?.calorieTarget || 2200;
  const meals = {
    breakfast: { meal: "Oatmeal with banana & honey", cal: 380, protein: 12, carbs: 62, fat: 9 },
    lunch: { meal: "Grilled chicken salad", cal: 380, protein: 35, carbs: 18, fat: 16 },
    dinner: { meal: "Salmon with rice & veggies", cal: 520, protein: 38, carbs: 42, fat: 18 },
    snack: { meal: "Protein shake + banana", cal: 280, protein: 30, carbs: 32, fat: 6 },
  };
  let type = "lunch";
  if (/breakfast|morning/.test(q)) type = "breakfast";
  else if (/dinner|evening/.test(q)) type = "dinner";
  else if (/snack/.test(q)) type = "snack";
  const item = meals[type];
  const remaining = target - item.cal;
  return `🍽️ Detected: ${item.meal}\n📊 Calories: ${item.cal} kcal | Protein: ${item.protein}g | Carbs: ${item.carbs}g | Fat: ${item.fat}g\n📈 Daily budget: ${target} kcal — ~${Math.max(0, remaining)} kcal remaining.`;
}
