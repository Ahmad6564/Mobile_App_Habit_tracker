import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "habitforge.v4";

const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const defaultProfile = () => ({
  name: "You",
  username: "you",
  dob: "",
  gender: "",
  country: typeof navigator !== "undefined" ? (navigator.language?.split("-")[1] || "") : "",
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
  heightCm: "",
  weightKg: "",
  bio: "",
  goalsStatement: "",
  referralCode: genCode()
});

const defaultSettings = () => ({
  theme: "dark",
  notifications: false,
  reminderTime: "21:30",
  privacy: "public",
  calorieTarget: 2200
});

const PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
  "#f59e0b",
  "#c084fc"
];

const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const today = () => fmt(new Date());

const parseDate = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const seedHabits = () => {
  const seed = [
    { name: "Morning Run", icon: "run", goal: 1, unit: "session", category: "Fitness" },
    { name: "Meditation", icon: "meditate", goal: 1, unit: "session", category: "Mind" },
    { name: "Drink 2L Water", icon: "water", goal: 8, unit: "glasses", category: "Health" },
    { name: "Read Book", icon: "book", goal: 20, unit: "pages", category: "Growth" },
    { name: "Stretching", icon: "stretch", goal: 1, unit: "session", category: "Fitness" },
    { name: "No Sugar", icon: "shield", goal: 1, unit: "day", category: "Diet" }
  ];
  return seed.map((h, i) => ({
    id: `h-${Date.now()}-${i}`,
    color: PALETTE[i % PALETTE.length],
    createdAt: today(),
    logs: {},
    ...h
  }));
};

const seedTasks = () => [
  {
    id: `t-${Date.now()}-1`,
    title: "Plan tomorrow's workout split",
    notes: "Push / Pull / Legs",
    due: today(),
    priority: "high",
    done: false,
    createdAt: today()
  },
  {
    id: `t-${Date.now()}-2`,
    title: "Buy protein powder",
    notes: "",
    due: today(),
    priority: "medium",
    done: false,
    createdAt: today()
  }
];

const seedPosts = () => [
  {
    id: "p1",
    kind: "post",
    user: "Areeba",
    avatar: "🌸",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70",
    caption:
      "How I reached a 14-day hydration streak — habit stacking with my laptop reminders.",
    tags: ["hydration", "habits"],
    likes: 238,
    liked: false,
    reposts: 12,
    saved: false,
    createdAt: today(),
    comments: [
      { id: "c1", user: "Hassan", text: "Love this 🔥" },
      { id: "c2", user: "Nimra", text: "Trying this today 🚀" }
    ]
  },
  {
    id: "p2",
    kind: "reel",
    user: "Hassan",
    avatar: "🏃",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=70",
    caption: "Morning run reel: day 21 — parking my phone in another room helped.",
    tags: ["running"],
    likes: 190,
    liked: false,
    reposts: 5,
    saved: false,
    createdAt: today(),
    comments: []
  },
  {
    id: "p3",
    kind: "post",
    user: "Nimra",
    avatar: "🧘",
    image:
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=900&q=70",
    caption: "My meditation corner — small cue, huge impact.",
    tags: ["mindfulness"],
    likes: 315,
    liked: true,
    reposts: 22,
    saved: true,
    createdAt: today(),
    comments: [{ id: "c3", user: "Areeba", text: "So peaceful 🕊️" }]
  }
];

const loadState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

export function useAppStore() {
  const [state, setState] = useState(() => {
    const cached = loadState();
    if (cached) {
      return {
        habits: cached.habits || seedHabits(),
        tasks: cached.tasks || seedTasks(),
        posts: cached.posts || seedPosts(),
        viewYear: cached.viewYear ?? new Date().getFullYear(),
        viewMonth: cached.viewMonth ?? new Date().getMonth(),
        profile: { ...defaultProfile(), ...(cached.profile || {}) },
        settings: { ...defaultSettings(), ...(cached.settings || {}) },
        chat: cached.chat || [],
        coachChats: cached.coachChats || [],
        coachActiveId: cached.coachActiveId || null,
        nutritionChats: cached.nutritionChats || [],
        nutritionActiveId: cached.nutritionActiveId || null,
        search: ""
      };
    }
    const now = new Date();
    return {
      habits: seedHabits(),
      tasks: seedTasks(),
      posts: seedPosts(),
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth(),
      profile: defaultProfile(),
      settings: defaultSettings(),
      chat: [],
      coachChats: [],
      coachActiveId: null,
      nutritionChats: [],
      nutritionActiveId: null,
      search: ""
    };
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Apply theme to document
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = state.settings.theme;
  }, [state.settings.theme]);

  // --- Habits
  const addHabit = useCallback((payload) => {
    setState((prev) => {
      const id = `h-${Date.now()}`;
      const color = PALETTE[prev.habits.length % PALETTE.length];
      const habit = {
        id,
        name: payload.name.trim(),
        icon: payload.icon || "✨",
        goal: Number(payload.goal) || 1,
        unit: payload.unit || "times",
        category: payload.category || "General",
        color,
        createdAt: today(),
        logs: {}
      };
      return { ...prev, habits: [habit, ...prev.habits] };
    });
  }, []);

  const updateHabit = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, ...patch } : h))
    }));
  }, []);

  const deleteHabit = useCallback((id) => {
    setState((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
  }, []);

  // Single-click toggles fully complete for that day, click again clears
  const toggleHabit = useCallback((id, date = today()) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h;
        const logs = { ...(h.logs || {}) };
        const cur = logs[date] || 0;
        if (cur >= h.goal) delete logs[date];
        else logs[date] = h.goal;
        return { ...h, logs };
      })
    }));
  }, []);

  const setHabitProgress = useCallback((id, date, value) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === id ? { ...h, logs: { ...(h.logs || {}), [date]: Math.max(0, value) } } : h
      )
    }));
  }, []);

  // --- Tasks
  const addTask = useCallback((payload) => {
    setState((prev) => ({
      ...prev,
      tasks: [
        {
          id: `t-${Date.now()}`,
          title: payload.title.trim(),
          notes: payload.notes || "",
          due: payload.due || today(),
          priority: payload.priority || "medium",
          done: false,
          createdAt: today()
        },
        ...prev.tasks
      ]
    }));
  }, []);

  const toggleTask = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    }));
  }, []);

  const deleteTask = useCallback((id) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, []);

  // --- Month navigation
  const goToMonth = useCallback((year, month) => {
    setState((prev) => ({ ...prev, viewYear: year, viewMonth: month }));
  }, []);

  const goPrevMonth = useCallback(() => {
    setState((prev) => {
      let y = prev.viewYear;
      let m = prev.viewMonth - 1;
      if (m < 0) { m = 11; y -= 1; }
      return { ...prev, viewYear: y, viewMonth: m };
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setState((prev) => {
      let y = prev.viewYear;
      let m = prev.viewMonth + 1;
      if (m > 11) { m = 0; y += 1; }
      return { ...prev, viewYear: y, viewMonth: m };
    });
  }, []);

  const goThisMonth = useCallback(() => {
    const now = new Date();
    setState((prev) => ({ ...prev, viewYear: now.getFullYear(), viewMonth: now.getMonth() }));
  }, []);

  // --- Community
  const addPost = useCallback((payload) => {
    setState((prev) => ({
      ...prev,
      posts: [
        {
          id: `p-${Date.now()}`,
          kind: payload.kind || "post",
          user: payload.user || "You",
          avatar: payload.avatar || "🧑",
          image: payload.image || "",
          caption: payload.caption || "",
          tags: payload.tags || [],
          likes: 0,
          liked: false,
          reposts: 0,
          saved: false,
          createdAt: today(),
          comments: []
        },
        ...(prev.posts || [])
      ]
    }));
  }, []);

  const togglePostLike = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
      )
    }));
  }, []);

  const togglePostSave = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))
    }));
  }, []);

  const repostPost = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === id ? { ...p, reposts: p.reposts + 1 } : p))
    }));
  }, []);

  const addComment = useCallback((id, text) => {
    if (!text.trim()) return;
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: `c-${Date.now()}`, user: "You", text: text.trim() }
              ]
            }
          : p
      )
    }));
  }, []);

  const deleteComment = useCallback((postId, commentId) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
      )
    }));
  }, []);

  // --- Profile / Settings / Theme
  const updateProfile = useCallback((patch) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const setTheme = useCallback((theme) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, theme } }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === "dark" ? "light" : "dark"
      }
    }));
  }, []);

  const setSearch = useCallback((q) => {
    setState((prev) => ({ ...prev, search: q }));
  }, []);

  // --- Chat (AI coach) — multi-conversation
  const newCoachChat = useCallback(() => {
    setState((prev) => {
      const id = `cc-${Date.now()}`;
      const chat = { id, title: "New chat", messages: [], createdAt: Date.now() };
      return { ...prev, coachChats: [chat, ...prev.coachChats], coachActiveId: id };
    });
  }, []);

  const selectCoachChat = useCallback((id) => {
    setState((prev) => ({ ...prev, coachActiveId: id }));
  }, []);

  const deleteCoachChat = useCallback((id) => {
    setState((prev) => {
      const chats = prev.coachChats.filter((c) => c.id !== id);
      const activeId = prev.coachActiveId === id ? (chats[0]?.id || null) : prev.coachActiveId;
      return { ...prev, coachChats: chats, coachActiveId: activeId };
    });
  }, []);

  const sendCoachMessage = useCallback((text) => {
    if (!text.trim()) return;
    setState((prev) => {
      let activeId = prev.coachActiveId;
      let chats = [...prev.coachChats];

      // Auto-create a new chat if none active
      if (!activeId || !chats.find((c) => c.id === activeId)) {
        activeId = `cc-${Date.now()}`;
        chats = [{ id: activeId, title: "New chat", messages: [], createdAt: Date.now() }, ...chats];
      }

      const userMsg = { id: `m-${Date.now()}`, role: "user", text: text.trim(), ts: Date.now() };
      const reply = buildCoachReply(text, prev);
      const botMsg = { id: `m-${Date.now() + 1}`, role: "coach", text: reply, ts: Date.now() + 1 };

      chats = chats.map((c) => {
        if (c.id !== activeId) return c;
        const msgs = [...c.messages, userMsg, botMsg];
        // Auto-title from first user message
        const title = c.messages.length === 0 ? text.trim().slice(0, 40) : c.title;
        return { ...c, messages: msgs, title };
      });

      return { ...prev, coachChats: chats, coachActiveId: activeId };
    });
  }, []);

  // --- Nutrition AI chat — multi-conversation
  const newNutritionChat = useCallback(() => {
    setState((prev) => {
      const id = `nc-${Date.now()}`;
      const chat = { id, title: "New chat", messages: [], createdAt: Date.now() };
      return { ...prev, nutritionChats: [chat, ...prev.nutritionChats], nutritionActiveId: id };
    });
  }, []);

  const selectNutritionChat = useCallback((id) => {
    setState((prev) => ({ ...prev, nutritionActiveId: id }));
  }, []);

  const deleteNutritionChat = useCallback((id) => {
    setState((prev) => {
      const chats = prev.nutritionChats.filter((c) => c.id !== id);
      const activeId = prev.nutritionActiveId === id ? (chats[0]?.id || null) : prev.nutritionActiveId;
      return { ...prev, nutritionChats: chats, nutritionActiveId: activeId };
    });
  }, []);

  const sendNutritionMessage = useCallback((text) => {
    if (!text.trim()) return;
    setState((prev) => {
      let activeId = prev.nutritionActiveId;
      let chats = [...prev.nutritionChats];

      if (!activeId || !chats.find((c) => c.id === activeId)) {
        activeId = `nc-${Date.now()}`;
        chats = [{ id: activeId, title: "New chat", messages: [], createdAt: Date.now() }, ...chats];
      }

      const userMsg = { id: `m-${Date.now()}`, role: "user", text: text.trim(), ts: Date.now() };
      const reply = buildNutritionReply(text, prev);
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

  // Keep legacy sendChat/clearChat for backward compatibility
  const sendChat = useCallback((text) => {
    sendCoachMessage(text);
  }, [sendCoachMessage]);

  const clearChat = useCallback(() => {
    setState((prev) => ({ ...prev, chat: [] }));
  }, []);

  const stats = useMemo(
    () => computeStats(state.habits, state.tasks, state.viewYear, state.viewMonth),
    [state.habits, state.tasks, state.viewYear, state.viewMonth]
  );

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return state.viewYear === now.getFullYear() && state.viewMonth === now.getMonth();
  }, [state.viewYear, state.viewMonth]);

  return {
    habits: state.habits,
    tasks: state.tasks,
    posts: state.posts || [],
    viewYear: state.viewYear,
    viewMonth: state.viewMonth,
    isCurrentMonth,
    stats,
    profile: state.profile,
    settings: state.settings,
    chat: state.chat || [],
    coachChats: state.coachChats || [],
    coachActiveId: state.coachActiveId,
    nutritionChats: state.nutritionChats || [],
    nutritionActiveId: state.nutritionActiveId,
    search: state.search || "",
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    setHabitProgress,
    addTask,
    toggleTask,
    deleteTask,
    goToMonth,
    goPrevMonth,
    goNextMonth,
    goThisMonth,
    addPost,
    togglePostLike,
    togglePostSave,
    repostPost,
    addComment,
    deleteComment,
    updateProfile,
    updateSettings,
    setTheme,
    toggleTheme,
    setSearch,
    sendChat,
    clearChat,
    newCoachChat,
    selectCoachChat,
    deleteCoachChat,
    sendCoachMessage,
    newNutritionChat,
    selectNutritionChat,
    deleteNutritionChat,
    sendNutritionMessage
  };
}

function computeStats(habits, tasks, year, month) {
  const monthDates = getMonthDates(year, month);
  const weeks = chunkWeeks(monthDates);
  const todayKey = today();

  const dailyPercent = monthDates.map((d) => {
    if (!habits.length) return 0;
    const totalGoal = habits.reduce((sum, h) => sum + h.goal, 0);
    const totalDone = habits.reduce((sum, h) => sum + Math.min(h.goal, h.logs?.[d] || 0), 0);
    return totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;
  });

  const todayInMonth = monthDates.includes(todayKey);
  const refKey = todayInMonth ? todayKey : monthDates[monthDates.length - 1];
  const refGoal = habits.reduce((sum, h) => sum + h.goal, 0);
  const refDone = habits.reduce(
    (sum, h) => sum + Math.min(h.goal, h.logs?.[refKey] || 0),
    0
  );
  const overallPercent = refGoal ? Math.round((refDone / refGoal) * 100) : 0;

  // Today: habits fully done + tasks done out of total habits + tasks
  const todayHabitsDone = habits.filter((h) => (h.logs?.[refKey] || 0) >= h.goal).length;
  const todayTasksDone = (tasks || []).filter((t) => t.done).length;
  const todayItemsDone = todayHabitsDone + todayTasksDone;
  const todayItemsTotal = habits.length + (tasks || []).length;

  // Monthly: sum of done quantity vs sum of total goal quantity across every day in month
  const monthTotalGoal = habits.reduce((s, h) => s + h.goal, 0) * monthDates.length;
  const monthTotalDone = habits.reduce(
    (s, h) => s + monthDates.reduce((a, d) => a + Math.min(h.goal, h.logs?.[d] || 0), 0),
    0
  );

  // Month avg
  const monthAvg = dailyPercent.length
    ? Math.round(dailyPercent.reduce((a, b) => a + b, 0) / dailyPercent.length)
    : 0;

  const top = habits
    .map((h) => {
      const monthLogs = monthDates
        .map((d) => Math.min(h.goal, h.logs?.[d] || 0))
        .reduce((a, b) => a + b, 0);
      const expected = monthDates.filter((d) => d <= todayKey).length * h.goal;
      const pct = expected ? Math.round((monthLogs / expected) * 100) : 0;
      return { id: h.id, name: h.name, icon: h.icon, color: h.color, pct, total: monthLogs };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  const weekStats = weeks.map((days) => {
    const realDays = days.filter(Boolean);
    let totalGoal = 0;
    let totalDone = 0;
    let fullChecks = 0;
    let possibleChecks = 0;
    realDays.forEach((d) => {
      habits.forEach((h) => {
        totalGoal += h.goal;
        possibleChecks += 1;
        const v = Math.min(h.goal, h.logs?.[d] || 0);
        totalDone += v;
        if (v >= h.goal) fullChecks += 1;
      });
    });
    const pct = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;
    return { days, realDays, totalGoal, totalDone, fullChecks, possibleChecks, pct };
  });

  return {
    dailyPercent,
    monthDates,
    weeks,
    weekStats,
    overallPercent,
    monthAvg,
    refKey,
    refDone,
    refGoal,
    todayInMonth,
    top,
    todayItemsDone,
    todayItemsTotal,
    todayHabitsDone,
    todayTasksDone,
    monthTotalGoal,
    monthTotalDone
  };
}

function getMonthDates(year, month) {
  const last = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: last }, (_, i) => fmt(new Date(year, month, i + 1)));
}

function chunkWeeks(dates) {
  // Sequential 7-day chunks: WEEK 1 = days 1-7, WEEK 2 = days 8-14, etc.
  // Matches the Excel reference layout where no leading/trailing blank cells appear.
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }
  return weeks;
}

export function computeStreak(habit) {
  if (!habit?.logs) return 0;
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i += 1) {
    const key = fmt(d);
    if ((habit.logs[key] || 0) >= habit.goal) {
      streak += 1;
    } else if (i !== 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export { today, fmt, PALETTE };

// Lightweight rule-based coach. Uses real user habit + task data to reply.
function buildCoachReply(input, state) {
  const q = input.toLowerCase();
  const habits = state.habits || [];
  const tasks = state.tasks || [];
  const todayKey = today();
  const totalGoal = habits.reduce((s, h) => s + h.goal, 0);
  const totalDone = habits.reduce((s, h) => s + Math.min(h.goal, h.logs?.[todayKey] || 0), 0);
  const pct = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;
  const open = tasks.filter((t) => !t.done);
  const dueToday = tasks.filter((t) => !t.done && t.due === todayKey);

  const struggling = habits
    .map((h) => {
      const days = 14;
      let done = 0;
      const d = new Date();
      for (let i = 0; i < days; i += 1) {
        const k = fmt(d);
        if ((h.logs?.[k] || 0) >= h.goal) done += 1;
        d.setDate(d.getDate() - 1);
      }
      return { h, done, pct: Math.round((done / days) * 100) };
    })
    .sort((a, b) => a.pct - b.pct);

  const weakest = struggling[0];
  const strongest = struggling[struggling.length - 1];

  const lines = [];

  if (/water|hydrat/.test(q)) {
    const water = habits.find((h) => /water|hydrat/i.test(h.name));
    if (water) {
      const cur = water.logs?.[todayKey] || 0;
      lines.push(`Today you have logged ${cur}/${water.goal} ${water.unit} for ${water.name}.`);
      lines.push("Tip: keep a bottle on your desk and refill it twice in the morning, twice in the afternoon. Pair it with your existing meals (cue + habit stacking).");
    } else {
      lines.push("You don't have a water habit yet. Add one with a goal of 8 glasses/day — it's the easiest win for energy and skin.");
    }
  } else if (/diet|food|meal|nutrition|calorie/.test(q)) {
    lines.push(`Your daily calorie target is ${state.settings?.calorieTarget || 2200} kcal.`);
    lines.push("For sustainable diet habits: protein with every meal (palm-sized), fill half your plate with veg, and limit liquid sugar. Log meals in Nutrition AI to get macro estimates.");
  } else if (/sleep/.test(q)) {
    lines.push("Aim for a fixed wind-down at the same time each night. Add a 'Sleep 8h' habit and pair it with a 'no-screens after 22:30' rule.");
  } else if (/streak|consistent|how am i/.test(q)) {
    lines.push(`Today: ${totalDone}/${totalGoal} units done (${pct}%).`);
    if (strongest) lines.push(`Strongest habit (last 14 days): ${strongest.h.name} — ${strongest.pct}%.`);
    if (weakest && weakest !== strongest) lines.push(`Weakest habit: ${weakest.h.name} — ${weakest.pct}%. Try shrinking the goal for one week to rebuild momentum.`);
  } else if (/task|deadline|due/.test(q)) {
    lines.push(`You have ${open.length} open task(s). ${dueToday.length} are due today.`);
    if (dueToday.length) {
      lines.push("Tackle the highest-priority one first using a 25-minute focused block.");
    }
  } else if (/improve|better|advice|coach|help/.test(q)) {
    lines.push(`Snapshot — Today ${pct}% done, ${open.length} open task(s).`);
    if (weakest) lines.push(`Focus area: ${weakest.h.name}. Last 14 days: ${weakest.pct}% completion.`);
    lines.push("Two specific actions for tomorrow: 1) stack the weak habit right after an existing daily routine (e.g., right after brushing teeth), 2) set a 21:30 reminder so the streak isn't broken.");
  } else if (/profile|name|who/.test(q)) {
    lines.push(`Hi ${state.profile?.name || "there"} — I have access to your tracked habits, tasks, and monthly history. Ask me about water, sleep, diet, streaks, or how to improve a specific habit.`);
  } else {
    lines.push(`Today: ${totalDone}/${totalGoal} units done (${pct}%), ${dueToday.length} task(s) due today.`);
    lines.push("Try asking: 'how can I improve my water habit?' · 'what should I focus on?' · 'tips for better sleep?' · 'how is my streak?'");
  }

  return lines.join("\n\n");
}

// Nutrition AI — rule-based reply
function buildNutritionReply(input, state) {
  const q = input.toLowerCase();
  const target = state.settings?.calorieTarget || 2200;

  // Simulate meal photo analysis — random but realistic values based on meal type
  const meals = {
    breakfast: [
      { meal: "Oatmeal with banana & honey", cal: 380, protein: 12, carbs: 62, fat: 9 },
      { meal: "2 Eggs + toast + avocado", cal: 420, protein: 22, carbs: 28, fat: 26 },
      { meal: "Pancakes with maple syrup", cal: 510, protein: 8, carbs: 72, fat: 18 },
      { meal: "Paratha with yogurt & pickle", cal: 450, protein: 10, carbs: 52, fat: 22 },
    ],
    lunch: [
      { meal: "Chicken biryani with raita", cal: 620, protein: 32, carbs: 68, fat: 22 },
      { meal: "Grilled chicken salad", cal: 380, protein: 35, carbs: 18, fat: 16 },
      { meal: "Dal + roti + sabzi", cal: 480, protein: 16, carbs: 62, fat: 14 },
      { meal: "Burger with fries", cal: 820, protein: 28, carbs: 78, fat: 42 },
    ],
    dinner: [
      { meal: "Salmon with rice & veggies", cal: 520, protein: 38, carbs: 42, fat: 18 },
      { meal: "Chicken karahi with naan", cal: 680, protein: 34, carbs: 56, fat: 30 },
      { meal: "Pasta with meat sauce", cal: 580, protein: 24, carbs: 72, fat: 20 },
      { meal: "Grilled fish with salad", cal: 340, protein: 36, carbs: 12, fat: 14 },
    ],
    snack: [
      { meal: "Protein shake + banana", cal: 280, protein: 30, carbs: 32, fat: 6 },
      { meal: "Samosa (2 pcs) with chutney", cal: 360, protein: 6, carbs: 38, fat: 20 },
      { meal: "Fruit bowl with nuts", cal: 220, protein: 5, carbs: 34, fat: 8 },
      { meal: "Biscuits with tea", cal: 180, protein: 3, carbs: 28, fat: 7 },
    ],
  };

  // Determine which meal type was requested
  let type = "lunch";
  if (/breakfast|morning/.test(q)) type = "breakfast";
  else if (/lunch/.test(q)) type = "lunch";
  else if (/dinner|evening/.test(q)) type = "dinner";
  else if (/snack/.test(q)) type = "snack";

  const options = meals[type];
  const item = options[Math.floor(Math.random() * options.length)];
  const remaining = target - item.cal;

  const lines = [];
  lines.push(`🍽️ Detected: ${item.meal}`);
  lines.push(`📊 Nutrition Breakdown:\n• Calories: ${item.cal} kcal\n• Protein: ${item.protein}g\n• Carbs: ${item.carbs}g\n• Fat: ${item.fat}g`);
  lines.push(`📈 Daily budget: ${target} kcal — after this meal you have ~${Math.max(0, remaining)} kcal remaining today.`);

  if (item.cal > 600) {
    lines.push("⚠️ This is a high-calorie meal. Consider lighter portions for your next meal, or add a 30-min walk to offset.");
  } else if (item.protein > 25) {
    lines.push("✅ Great protein content! This supports muscle recovery and keeps you full longer.");
  } else {
    lines.push("💡 Tip: Add a protein source (egg, yogurt, chicken) to hit your daily protein target.");
  }

  return lines.join("\n\n");
}
