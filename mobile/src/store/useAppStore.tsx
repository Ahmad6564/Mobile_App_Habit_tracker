import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { HABIT_PALETTE } from "../theme";
import { analyzeFood, NutritionResult } from "../lib/nutritionAI";

export type { NutritionResult } from "../lib/nutritionAI";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Habit = {
  id: string;
  name: string;
  icon: string;
  goal: number;
  unit: string;
  category: string;
  color: string;
  createdAt: string;
  logs: Record<string, number>;
};

export type Task = {
  id: string;
  title: string;
  notes: string;
  due: string;
  priority: "low" | "medium" | "high";
  done: boolean;
  createdAt: string;
};

export type Comment = { id: string; user: string; text: string; ts: number };
export type PostFormat = "text" | "video" | "gallery";
export type Post = {
  id: string;
  kind: "post" | "reel";
  user: string;
  avatar: string;
  image: string;
  media: string[];
  format: PostFormat;
  song: string;
  caption: string;
  tags: string[];
  likes: number;
  liked: boolean;
  reposts: number;
  reposted: boolean;
  saved: boolean;
  createdAt: string;
  comments: Comment[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
  ts: number;
  imageUri?: string;
  nutrition?: NutritionResult;
  loading?: boolean;
};
export type Chat = { id: string; title: string; messages: ChatMessage[]; createdAt: number };

export type DMMessage = {
  id: string;
  from: string;
  text: string;
  ts: number;
  mediaUri?: string;
  mediaType?: "image" | "video";
};

export type Notif = {
  id: string;
  type: "like" | "comment" | "repost" | "follow" | "follow_request" | "message";
  from: string;
  text: string;
  postId?: string;
  ts: number;
  read: boolean;
};

export type CommunityUser = {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  privacy: "public" | "private";
  followersCount?: number;
  followingCount?: number;
};

export type Profile = {
  name: string;
  username: string;
  avatarUri: string;
  dob: string;
  gender: string;
  country: string;
  timezone: string;
  heightCm: string;
  weightKg: string;
  bio: string;
  goalsStatement: string;
  referralCode: string;
};

export type Settings = {
  theme: "dark" | "light";
  notifications: boolean;
  reminderTime: string;
  privacy: "public" | "followers" | "private";
  calorieTarget: number;
};

export type AppState = {
  habits: Habit[];
  tasks: Task[];
  posts: Post[];
  viewYear: number;
  viewMonth: number;
  profile: Profile;
  settings: Settings;
  coachChats: Chat[];
  coachActiveId: string | null;
  nutritionChats: Chat[];
  nutritionActiveId: string | null;
  nutritionLog: Record<string, NutritionResult[]>; // key = date YYYY-MM-DD
  // community
  users: CommunityUser[];
  following: string[];                // usernames I follow (accepted)
  followers: string[];                // usernames who follow me (accepted)
  followIncoming: string[];           // requests sent to me (private profiles)
  followOutgoing: string[];           // requests I've sent (still pending)
  blocked: string[];                  // usernames I have blocked
  notifications: Notif[];
  dms: Record<string, DMMessage[]>;   // key = other user's username
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = "habitforge.v1";

const pad = (n: number) => String(n).padStart(2, "0");
export const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => fmt(new Date());
export const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const defaultProfile = (): Profile => ({
  name: "You",
  username: "you",
  avatarUri: "",
  dob: "",
  gender: "",
  country: "",
  timezone: "",
  heightCm: "",
  weightKg: "",
  bio: "",
  goalsStatement: "",
  referralCode: genCode()
});

const defaultSettings = (): Settings => ({
  theme: "dark",
  notifications: false,
  reminderTime: "21:30",
  privacy: "public",
  calorieTarget: 2200
});

const seedHabits = (): Habit[] => {
  const seed = [
    { name: "Morning Run", icon: "run", goal: 1, unit: "session", category: "Fitness" },
    { name: "Meditation", icon: "meditate", goal: 1, unit: "session", category: "Mind" },
    { name: "Drink 2L Water", icon: "water", goal: 8, unit: "glasses", category: "Health" },
    { name: "Read Book", icon: "book", goal: 20, unit: "pages", category: "Growth" },
    { name: "Stretching", icon: "stretch", goal: 1, unit: "session", category: "Fitness" },
    { name: "No Sugar", icon: "shield", goal: 1, unit: "day", category: "Diet" }
  ];
  const t = today();
  return seed.map((h, i) => ({
    id: `h-${Date.now()}-${i}`,
    color: HABIT_PALETTE[i % HABIT_PALETTE.length],
    createdAt: t,
    logs: {},
    ...h
  }));
};

const seedTasks = (): Task[] => {
  const t = today();
  return [
    { id: `t-${Date.now()}-1`, title: "Plan tomorrow's workout split", notes: "Push / Pull / Legs", due: t, priority: "high", done: false, createdAt: t },
    { id: `t-${Date.now()}-2`, title: "Buy protein powder", notes: "", due: t, priority: "medium", done: false, createdAt: t }
  ];
};

const seedPosts = (): Post[] => {
  const t = today();
  const now = Date.now();
  return [
    {
      id: "p1", kind: "post", user: "Areeba", avatar: "🌸",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70",
      media: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70"],
      format: "gallery",
      song: "Blinding Lights - The Weeknd",
      caption: "How I reached a 14-day hydration streak — habit stacking with my laptop reminders.",
      tags: ["hydration", "habits"], likes: 238, liked: false, reposts: 12, reposted: false, saved: false, createdAt: t,
      comments: [
        { id: "c1", user: "Hassan", text: "Love this 🔥", ts: now - 60000 },
        { id: "c2", user: "Nimra", text: "Trying this today 🚀", ts: now - 30000 }
      ]
    },
    {
      id: "p2", kind: "reel", user: "Hassan", avatar: "🏃",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=70",
      media: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=70"],
      format: "video",
      song: "Run Boy Run - Woodkid",
      caption: "Morning run reel: day 21 — parking my phone in another room helped.",
      tags: ["running"], likes: 190, liked: false, reposts: 5, reposted: false, saved: false, createdAt: t, comments: []
    },
    {
      id: "p3", kind: "post", user: "Nimra", avatar: "🧘",
      image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=900&q=70",
      media: [],
      format: "text",
      song: "",
      caption: "My meditation corner — small cue, huge impact.",
      tags: ["mindfulness"], likes: 315, liked: true, reposts: 22, reposted: false, saved: true, createdAt: t,
      comments: [{ id: "c3", user: "Areeba", text: "So peaceful 🕊️", ts: now - 120000 }]
    }
  ];
};

const seedUsers = (): CommunityUser[] => [
  { username: "Areeba", name: "Areeba Khan", avatar: "🌸", bio: "Hydration queen · 14d streak", privacy: "public", followersCount: 1240, followingCount: 312 },
  { username: "Hassan", name: "Hassan Ali", avatar: "🏃", bio: "Runner · early bird", privacy: "public", followersCount: 932, followingCount: 201 },
  { username: "Nimra", name: "Nimra Shah", avatar: "🧘", bio: "Mindfulness coach", privacy: "private", followersCount: 2400, followingCount: 188 },
  { username: "Zaid", name: "Zaid Khan", avatar: "💪", bio: "Lifting & macros", privacy: "public", followersCount: 711, followingCount: 144 },
  { username: "Sara", name: "Sara Iqbal", avatar: "📚", bio: "Reading 20 pages/day", privacy: "private", followersCount: 508, followingCount: 281 }
];

function normalizePost(raw: Partial<Post>): Post {
  const media = Array.isArray(raw.media)
    ? raw.media.filter(Boolean)
    : raw.image
      ? [raw.image]
      : [];
  const format: PostFormat =
    raw.format ||
    (raw.kind === "reel" ? "video" : media.length > 1 ? "gallery" : media.length === 1 ? "gallery" : "text");
  return {
    id: raw.id || `p-${Date.now()}`,
    kind: raw.kind || (format === "video" ? "reel" : "post"),
    user: raw.user || "you",
    avatar: raw.avatar || "🧑",
    image: raw.image || media[0] || "",
    media,
    format,
    song: raw.song || "",
    caption: raw.caption || "",
    tags: raw.tags || [],
    likes: typeof raw.likes === "number" ? raw.likes : 0,
    liked: !!raw.liked,
    reposts: typeof raw.reposts === "number" ? raw.reposts : 0,
    reposted: !!raw.reposted,
    saved: !!raw.saved,
    createdAt: raw.createdAt || today(),
    comments: raw.comments || []
  };
}

const initialState = (): AppState => {
  const now = new Date();
  return {
    habits: seedHabits(),
    tasks: seedTasks(),
    posts: seedPosts().map(normalizePost),
    viewYear: now.getFullYear(),
    viewMonth: now.getMonth(),
    profile: defaultProfile(),
    settings: defaultSettings(),
    coachChats: [],
    coachActiveId: null,
    nutritionChats: [],
    nutritionActiveId: null,
    nutritionLog: {},
    users: seedUsers(),
    following: [],
    followers: ["Areeba", "Hassan"],
    followIncoming: ["Zaid", "Sara"],
    followOutgoing: [],
    blocked: [],
    notifications: [
      { id: "ns1", type: "follow_request", from: "Zaid", text: "Zaid wants to follow you.", ts: Date.now() - 3600_000, read: false },
      { id: "ns2", type: "like", from: "Hassan", postId: "p1", text: "Hassan liked your post.", ts: Date.now() - 7200_000, read: false }
    ],
    dms: {}
  };
};

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------
export function computeStreak(h: Habit): number {
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = fmt(d);
    if ((h.logs?.[key] || 0) >= h.goal) { streak += 1; d.setDate(d.getDate() - 1); }
    else break;
    if (streak > 365) break;
  }
  return streak;
}

function buildCoachReply(text: string, state: AppState) {
  const q = text.toLowerCase();
  const topHabit = [...state.habits].sort((a, b) => computeStreak(b) - computeStreak(a))[0];
  if (q.includes("water") || q.includes("hydra")) {
    return "Hydration tip: anchor your water habit to existing cues — every time you sit at your desk, take 1 glass.\n\nTrack it as 8 glasses/day. You can log progress from the Habits tab.";
  }
  if (q.includes("sleep")) return "Sleep tip: cut blue light 60 min before bed, keep a fixed wake time, and aim for 7–9 hours.\n\nLogging a Sleep habit (goal 8 hours) helps you see the trend.";
  if (q.includes("week") || q.includes("focus")) return `Focus this week on your top habit: ${topHabit?.name || "your daily routine"}. Pick 3 days where you absolutely keep the streak alive.`;
  if (q.includes("streak")) {
    const longest = state.habits.reduce((m, h) => Math.max(m, computeStreak(h)), 0);
    return `Your longest current streak is ${longest} day(s). Keep it visible — a small win is still a win.`;
  }
  if (q.includes("diet") || q.includes("nutrition")) return `Based on your habits, aim for ~${state.settings.calorieTarget} kcal/day. Add 1.6–2.2 g protein per kg bodyweight, prioritize fibre and water.`;
  return "I'm here to help with habits, streaks, sleep and nutrition. Ask me anything — try one of the suggested prompts.";
}

function buildNutritionReply(_text: string, _state: AppState) {
  return "Analyzing your meal...";
}

function formatNutritionError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err || "");
  const msg = raw.toLowerCase();

  if (msg.includes("openai api key not configured")) {
    return "Nutrition AI is not configured yet. Add EXPO_PUBLIC_OPENAI_API_KEY in your .env and restart Expo.";
  }
  if (msg.includes("invalid api key") || msg.includes("401")) {
    return "Your OpenAI API key looks invalid. Update EXPO_PUBLIC_OPENAI_API_KEY and restart Expo.";
  }
  if (msg.includes("rate limit")) {
    return "Too many requests right now. Please wait a moment and try again.";
  }
  if (msg.includes("network request failed") || msg.includes("fetch failed") || msg.includes("typeerror")) {
    return "Couldn't reach Nutrition AI. Check your internet connection and try again.";
  }
  if (!raw.trim()) {
    return "Something went wrong while analyzing this meal. Please try again.";
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
type Ctx = {
  ready: boolean;
  state: AppState;
  // habits
  addHabit: (p: Partial<Habit> & { name: string }) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, date?: string) => void;
  // tasks
  addTask: (p: { title: string; notes?: string; due?: string; priority?: Task["priority"] }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  // calendar
  goPrevMonth: () => void;
  goNextMonth: () => void;
  goThisMonth: () => void;
  // posts
  addPost: (p: Partial<Post>) => void;
  togglePostLike: (id: string) => void;
  togglePostSave: (id: string) => void;
  togglePostRepost: (id: string) => void;
  addComment: (id: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  editComment: (postId: string, commentId: string, newText: string) => void;
  deletePost: (postId: string) => void;
  editPost: (postId: string, newText: string) => void;
  // community
  getUser: (username: string) => CommunityUser | undefined;
  isFollowing: (username: string) => boolean;
  hasRequested: (username: string) => boolean;
  isBlocked: (username: string) => boolean;
  followUser: (username: string) => void;
  unfollowUser: (username: string) => void;
  acceptFollow: (username: string) => void;
  declineFollow: (username: string) => void;
  cancelFollowRequest: (username: string) => void;
  blockUser: (username: string) => void;
  unblockUser: (username: string) => void;
  reportPost: (id: string) => void;
  // notifications
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  unreadNotifCount: () => number;
  // dms
  sendDM: (username: string, text: string, mediaUri?: string, mediaType?: "image" | "video") => void;
  markDMRead: (username: string) => void;
  unreadDMCount: () => number;
  // profile / settings
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleTheme: () => void;
  // chats
  newCoachChat: () => void;
  selectCoachChat: (id: string) => void;
  deleteCoachChat: (id: string) => void;
  sendCoachMessage: (text: string) => void;
  newNutritionChat: () => void;
  selectNutritionChat: (id: string) => void;
  deleteNutritionChat: (id: string) => void;
  sendNutritionMessage: (text: string, imageUri?: string) => void;
  resetApp: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const hydratedRef = useRef(false);

  // Hydrate
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          setState((prev) => ({
            ...prev,
            ...cached,
            posts: (cached.posts || prev.posts || []).map(normalizePost),
            profile: { ...defaultProfile(), ...(cached.profile || {}) },
            settings: { ...defaultSettings(), ...(cached.settings || {}) },
            users: cached.users && cached.users.length ? cached.users : seedUsers(),
            following: cached.following || [],
            followers: cached.followers || ["Areeba", "Hassan"],
            followIncoming: cached.followIncoming || [],
            followOutgoing: cached.followOutgoing || [],
            blocked: cached.blocked || [],
            notifications: cached.notifications || [],
            dms: cached.dms || {}
          }));
        }
      } catch {}
      hydratedRef.current = true;
      setReady(true);
    })();
  }, []);

  // Persist
  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const addHabit: Ctx["addHabit"] = useCallback((p) => {
    setState((prev) => {
      const id = `h-${Date.now()}`;
      const color = HABIT_PALETTE[prev.habits.length % HABIT_PALETTE.length];
      const habit: Habit = {
        id,
        name: p.name.trim(),
        icon: p.icon || "spark",
        goal: Number(p.goal) || 1,
        unit: p.unit || "times",
        category: p.category || "General",
        color,
        createdAt: today(),
        logs: {}
      };
      return { ...prev, habits: [habit, ...prev.habits] };
    });
  }, []);

  const updateHabit: Ctx["updateHabit"] = useCallback((id, patch) => {
    setState((prev) => ({ ...prev, habits: prev.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));
  }, []);

  const deleteHabit: Ctx["deleteHabit"] = useCallback((id) => {
    setState((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
  }, []);

  const toggleHabit: Ctx["toggleHabit"] = useCallback((id, date = today()) => {
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

  const addTask: Ctx["addTask"] = useCallback((p) => {
    setState((prev) => ({
      ...prev,
      tasks: [
        { id: `t-${Date.now()}`, title: p.title.trim(), notes: p.notes || "", due: p.due || today(), priority: p.priority || "medium", done: false, createdAt: today() },
        ...prev.tasks
      ]
    }));
  }, []);

  const updateTask: Ctx["updateTask"] = useCallback((id, patch) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  const toggleTask: Ctx["toggleTask"] = useCallback((id) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  }, []);

  const deleteTask: Ctx["deleteTask"] = useCallback((id) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, []);

  const goPrevMonth = useCallback(() => setState((p) => {
    let m = p.viewMonth - 1; let y = p.viewYear;
    if (m < 0) { m = 11; y -= 1; }
    return { ...p, viewYear: y, viewMonth: m };
  }), []);
  const goNextMonth = useCallback(() => setState((p) => {
    let m = p.viewMonth + 1; let y = p.viewYear;
    if (m > 11) { m = 0; y += 1; }
    return { ...p, viewYear: y, viewMonth: m };
  }), []);
  const goThisMonth = useCallback(() => { const now = new Date(); setState((p) => ({ ...p, viewYear: now.getFullYear(), viewMonth: now.getMonth() })); }, []);

  const addPost: Ctx["addPost"] = useCallback((payload) => {
    setState((prev) => ({
      ...prev,
      posts: [
        {
          id: `p-${Date.now()}`,
          kind: payload.kind || "post",
          user: payload.user || prev.profile.username || prev.profile.name || "you",
          avatar: payload.avatar || "🧑",
          image: payload.image || payload.media?.[0] || "",
          media: payload.media || (payload.image ? [payload.image] : []),
          format: payload.format || (payload.kind === "reel" ? "video" : payload.image ? "gallery" : "text"),
          song: payload.song || "",
          caption: payload.caption || "",
          tags: payload.tags || [],
          likes: 0, liked: false, reposts: 0, reposted: false, saved: false,
          createdAt: today(),
          comments: []
        },
        ...prev.posts
      ]
    }));
  }, []);

  const togglePostLike: Ctx["togglePostLike"] = useCallback((id) => {
    setState((prev) => {
      const me = prev.profile.username || prev.profile.name || "you";
      const post = prev.posts.find((p) => p.id === id);
      if (!post) return prev;
      const willLike = !post.liked;
      const posts = prev.posts.map((p) =>
        p.id === id ? { ...p, liked: willLike, likes: Math.max(0, p.likes + (willLike ? 1 : -1)) } : p
      );
      // notify author only when liking (not unliking) and not own post
      let notifications = prev.notifications;
      if (willLike && post.user !== me) {
        notifications = [
          { id: `n-${Date.now()}`, type: "like", from: me, postId: id, text: `${me} liked your ${post.kind}.`, ts: Date.now(), read: false },
          ...notifications
        ];
      }
      return { ...prev, posts, notifications };
    });
  }, []);

  const togglePostSave: Ctx["togglePostSave"] = useCallback((id) => {
    setState((prev) => ({ ...prev, posts: prev.posts.map((p) => p.id === id ? { ...p, saved: !p.saved } : p) }));
  }, []);

  const togglePostRepost: Ctx["togglePostRepost"] = useCallback((id) => {
    setState((prev) => {
      const me = prev.profile.username || prev.profile.name || "you";
      const post = prev.posts.find((p) => p.id === id);
      if (!post) return prev;
      const willRepost = !post.reposted;
      const posts = prev.posts.map((p) =>
        p.id === id ? { ...p, reposted: willRepost, reposts: Math.max(0, p.reposts + (willRepost ? 1 : -1)) } : p
      );
      let notifications = prev.notifications;
      if (willRepost && post.user !== me) {
        notifications = [
          { id: `n-${Date.now()}`, type: "repost", from: me, postId: id, text: `${me} reposted your ${post.kind}.`, ts: Date.now(), read: false },
          ...notifications
        ];
      }
      return { ...prev, posts, notifications };
    });
  }, []);

  const addComment: Ctx["addComment"] = useCallback((id, text) => {
    if (!text.trim()) return;
    setState((prev) => {
      const me = prev.profile.username || prev.profile.name || "you";
      const post = prev.posts.find((p) => p.id === id);
      if (!post) return prev;
      const newComment: Comment = { id: `c-${Date.now()}`, user: me, text: text.trim(), ts: Date.now() };
      const posts = prev.posts.map((p) => p.id === id ? { ...p, comments: [...p.comments, newComment] } : p);
      let notifications = prev.notifications;
      if (post.user !== me) {
        notifications = [
          { id: `n-${Date.now()}`, type: "comment", from: me, postId: id, text: `${me} commented: ${text.trim().slice(0, 60)}`, ts: Date.now(), read: false },
          ...notifications
        ];
      }
      return { ...prev, posts, notifications };
    });
  }, []);

  const deleteComment: Ctx["deleteComment"] = useCallback((postId, commentId) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p)
    }));
  }, []);

  const editComment: Ctx["editComment"] = useCallback((postId, commentId, newText) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => p.id === postId ? { ...p, comments: p.comments.map((c) => c.id === commentId ? { ...c, text: newText.trim() } : c) } : p)
    }));
  }, []);

  const deletePost: Ctx["deletePost"] = useCallback((postId) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== postId)
    }));
  }, []);

  const editPost: Ctx["editPost"] = useCallback((postId, newText) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => p.id === postId ? { ...p, caption: newText.trim() } : p)
    }));
  }, []);

  // ----- Community helpers -----
  const getUser: Ctx["getUser"] = useCallback((username) => {
    return state.users.find((u) => u.username === username);
  }, [state.users]);

  const isFollowing: Ctx["isFollowing"] = useCallback((username) => state.following.includes(username), [state.following]);
  const hasRequested: Ctx["hasRequested"] = useCallback((username) => state.followOutgoing.includes(username), [state.followOutgoing]);
  const isBlocked: Ctx["isBlocked"] = useCallback((username) => state.blocked.includes(username), [state.blocked]);

  const followUser: Ctx["followUser"] = useCallback((username) => {
    setState((prev) => {
      if (prev.following.includes(username) || prev.followOutgoing.includes(username)) return prev;
      const me = prev.profile.username || prev.profile.name || "you";
      const target = prev.users.find((u) => u.username === username);
      // public → auto-accept; private → send request
      if (target && target.privacy === "private") {
        return {
          ...prev,
          followOutgoing: [...prev.followOutgoing, username],
          notifications: [
            { id: `n-${Date.now()}`, type: "follow_request", from: me, text: `${me} requested to follow ${username}.`, ts: Date.now(), read: false },
            ...prev.notifications
          ]
        };
      }
      return {
        ...prev,
        following: [...prev.following, username],
        notifications: [
          { id: `n-${Date.now()}`, type: "follow", from: me, text: `${me} followed ${username}.`, ts: Date.now(), read: false },
          ...prev.notifications
        ]
      };
    });
  }, []);

  const unfollowUser: Ctx["unfollowUser"] = useCallback((username) => {
    setState((prev) => ({
      ...prev,
      following: prev.following.filter((u) => u !== username),
      followOutgoing: prev.followOutgoing.filter((u) => u !== username)
    }));
  }, []);

  const cancelFollowRequest: Ctx["cancelFollowRequest"] = useCallback((username) => {
    setState((prev) => ({ ...prev, followOutgoing: prev.followOutgoing.filter((u) => u !== username) }));
  }, []);

  const acceptFollow: Ctx["acceptFollow"] = useCallback((username) => {
    setState((prev) => {
      if (!prev.followIncoming.includes(username)) return prev;
      return {
        ...prev,
        followIncoming: prev.followIncoming.filter((u) => u !== username),
        followers: prev.followers.includes(username) ? prev.followers : [...prev.followers, username],
        notifications: prev.notifications.filter((n) => !(n.type === "follow_request" && n.from === username))
      };
    });
  }, []);

  const declineFollow: Ctx["declineFollow"] = useCallback((username) => {
    setState((prev) => ({
      ...prev,
      followIncoming: prev.followIncoming.filter((u) => u !== username),
      notifications: prev.notifications.filter((n) => !(n.type === "follow_request" && n.from === username))
    }));
  }, []);

  const blockUser: Ctx["blockUser"] = useCallback((username) => {
    setState((prev) => ({
      ...prev,
      blocked: prev.blocked.includes(username) ? prev.blocked : [...prev.blocked, username],
      following: prev.following.filter((u) => u !== username),
      followers: prev.followers.filter((u) => u !== username),
      followIncoming: prev.followIncoming.filter((u) => u !== username),
      followOutgoing: prev.followOutgoing.filter((u) => u !== username)
    }));
  }, []);

  const unblockUser: Ctx["unblockUser"] = useCallback((username) => {
    setState((prev) => ({ ...prev, blocked: prev.blocked.filter((u) => u !== username) }));
  }, []);

  const reportPost: Ctx["reportPost"] = useCallback((_id) => {
    // Increment a local report counter could be added; for now we just acknowledge.
  }, []);

  const markNotifRead: Ctx["markNotifRead"] = useCallback((id) => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => n.id === id ? { ...n, read: true } : n) }));
  }, []);

  const markAllNotifsRead: Ctx["markAllNotifsRead"] = useCallback(() => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) }));
  }, []);

  const unreadNotifCount: Ctx["unreadNotifCount"] = useCallback(() => state.notifications.filter((n) => !n.read).length, [state.notifications]);

  const sendDM: Ctx["sendDM"] = useCallback((username, text, mediaUri, mediaType) => {
    if (!text.trim() && !mediaUri) return;
    setState((prev) => {
      const me = prev.profile.username || prev.profile.name || "you";
      const msg: DMMessage = {
        id: `dm-${Date.now()}`,
        from: me,
        text: text.trim(),
        ts: Date.now(),
        mediaUri: mediaUri || undefined,
        mediaType: mediaUri ? mediaType || "image" : undefined
      };
      const existing = prev.dms[username] || [];
      return {
        ...prev,
        dms: { ...prev.dms, [username]: [...existing, msg] },
        notifications: [
          { id: `n-${Date.now()}`, type: "message", from: username, text: `${username} sent you a message.`, ts: Date.now(), read: false },
          ...prev.notifications
        ]
      };
    });
  }, []);

  const markDMRead: Ctx["markDMRead"] = useCallback((_username) => {
    // placeholder — could track lastReadTs per conversation
  }, []);

  const unreadDMCount: Ctx["unreadDMCount"] = useCallback(() => 0, []);

  const updateProfile: Ctx["updateProfile"] = useCallback((patch) => setState((p) => ({ ...p, profile: { ...p.profile, ...patch } })), []);
  const updateSettings: Ctx["updateSettings"] = useCallback((patch) => setState((p) => ({ ...p, settings: { ...p.settings, ...patch } })), []);
  const toggleTheme = useCallback(() => setState((p) => ({ ...p, settings: { ...p.settings, theme: p.settings.theme === "dark" ? "light" : "dark" } })), []);

  const resetApp: Ctx["resetApp"] = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    hydratedRef.current = false;
    setState(initialState());
    hydratedRef.current = true;
  }, []);

  const newCoachChat = useCallback(() => setState((p) => {
    const id = `cc-${Date.now()}`;
    return { ...p, coachChats: [{ id, title: "New chat", messages: [], createdAt: Date.now() }, ...p.coachChats], coachActiveId: id };
  }), []);
  const selectCoachChat: Ctx["selectCoachChat"] = useCallback((id) => setState((p) => ({ ...p, coachActiveId: id })), []);
  const deleteCoachChat: Ctx["deleteCoachChat"] = useCallback((id) => setState((p) => {
    const chats = p.coachChats.filter((c) => c.id !== id);
    return { ...p, coachChats: chats, coachActiveId: p.coachActiveId === id ? chats[0]?.id || null : p.coachActiveId };
  }), []);
  const sendCoachMessage: Ctx["sendCoachMessage"] = useCallback((text) => {
    if (!text.trim()) return;
    setState((prev) => {
      let activeId = prev.coachActiveId;
      let chats = [...prev.coachChats];
      if (!activeId || !chats.find((c) => c.id === activeId)) {
        activeId = `cc-${Date.now()}`;
        chats = [{ id: activeId, title: "New chat", messages: [], createdAt: Date.now() }, ...chats];
      }
      const u: ChatMessage = { id: `m-${Date.now()}`, role: "user", text: text.trim(), ts: Date.now() };
      const b: ChatMessage = { id: `m-${Date.now() + 1}`, role: "coach", text: buildCoachReply(text, prev), ts: Date.now() + 1 };
      chats = chats.map((c) => c.id !== activeId ? c : {
        ...c, messages: [...c.messages, u, b], title: c.messages.length === 0 ? text.trim().slice(0, 40) : c.title
      });
      return { ...prev, coachChats: chats, coachActiveId: activeId };
    });
  }, []);

  const newNutritionChat = useCallback(() => setState((p) => {
    const id = `nc-${Date.now()}`;
    return { ...p, nutritionChats: [{ id, title: "New chat", messages: [], createdAt: Date.now() }, ...p.nutritionChats], nutritionActiveId: id };
  }), []);
  const selectNutritionChat: Ctx["selectNutritionChat"] = useCallback((id) => setState((p) => ({ ...p, nutritionActiveId: id })), []);
  const deleteNutritionChat: Ctx["deleteNutritionChat"] = useCallback((id) => setState((p) => {
    const chats = p.nutritionChats.filter((c) => c.id !== id);
    return { ...p, nutritionChats: chats, nutritionActiveId: p.nutritionActiveId === id ? chats[0]?.id || null : p.nutritionActiveId };
  }), []);
  const sendNutritionMessage: Ctx["sendNutritionMessage"] = useCallback((text, imageUri) => {
    if (!text.trim()) return;
    const msgId = `m-${Date.now()}`;
    const loadingId = `m-${Date.now() + 1}`;

    // Add user message + loading placeholder
    setState((prev) => {
      let activeId = prev.nutritionActiveId;
      let chats = [...prev.nutritionChats];
      if (!activeId || !chats.find((c) => c.id === activeId)) {
        activeId = `nc-${Date.now()}`;
        chats = [{ id: activeId, title: "New chat", messages: [], createdAt: Date.now() }, ...chats];
      }
      const u: ChatMessage = { id: msgId, role: "user", text: text.trim(), ts: Date.now(), imageUri: imageUri || undefined };
      const loading: ChatMessage = { id: loadingId, role: "coach", text: "Analyzing your meal...", ts: Date.now() + 1, loading: true };
      chats = chats.map((c) => c.id !== activeId ? c : {
        ...c, messages: [...c.messages, u, loading], title: c.messages.length === 0 ? text.trim().slice(0, 40) : c.title
      });
      return { ...prev, nutritionChats: chats, nutritionActiveId: activeId };
    });

    // Call AI if image provided
    if (imageUri) {
      const mealType = text.replace(/^Analyze my /i, "").replace(/ meal$/i, "") || "meal";
      analyzeFood(imageUri, mealType)
        .then((result) => {
          const responseText = [
            `Detected meal: ${result.meal} (confidence ${Math.round(result.confidence * 100)}%).`,
            `Macros — Calories: ${result.calories} kcal · Protein: ${result.protein} g · Carbs: ${result.carbs} g · Fat: ${result.fat} g · Fiber: ${result.fiber} g.`,
            result.items.length > 0 ? `Items: ${result.items.map((i) => `${i.name} (${i.calories} kcal, ${i.portion})`).join(", ")}.` : "",
            result.suggestions.length > 0 ? `Suggestions: ${result.suggestions.join(" · ")}` : ""
          ].filter(Boolean).join("\n\n");

          setState((prev) => {
            const todayStr = today();
            const newLog = { ...prev.nutritionLog };
            newLog[todayStr] = [...(newLog[todayStr] || []), result];
            const chats = prev.nutritionChats.map((c) => c.id !== prev.nutritionActiveId ? c : {
              ...c,
              messages: c.messages.map((m) => m.id !== loadingId ? m : { ...m, text: responseText, loading: false, nutrition: result })
            });
            return { ...prev, nutritionChats: chats, nutritionLog: newLog };
          });
        })
        .catch((err) => {
          setState((prev) => {
            const chats = prev.nutritionChats.map((c) => c.id !== prev.nutritionActiveId ? c : {
              ...c,
              messages: c.messages.map((m) =>
                m.id !== loadingId
                  ? m
                  : { ...m, text: formatNutritionError(err), loading: false }
              )
            });
            return { ...prev, nutritionChats: chats };
          });
        });
    } else {
      // No image — use simple fallback reply
      setState((prev) => {
        const chats = prev.nutritionChats.map((c) => c.id !== prev.nutritionActiveId ? c : {
          ...c,
          messages: c.messages.map((m) => m.id !== loadingId ? m : { ...m, text: "Please upload a meal photo so I can analyze it. Use the Camera or Photo button below.", loading: false })
        });
        return { ...prev, nutritionChats: chats };
      });
    }
  }, []);

  const value = useMemo<Ctx>(() => ({
    ready, state,
    addHabit, updateHabit, deleteHabit, toggleHabit,
    addTask, updateTask, toggleTask, deleteTask,
    goPrevMonth, goNextMonth, goThisMonth,
    addPost, togglePostLike, togglePostSave, togglePostRepost, addComment, deleteComment, editComment, deletePost, editPost,
    getUser, isFollowing, hasRequested, isBlocked,
    followUser, unfollowUser, acceptFollow, declineFollow, cancelFollowRequest,
    blockUser, unblockUser, reportPost,
    markNotifRead, markAllNotifsRead, unreadNotifCount,
    sendDM, markDMRead, unreadDMCount,
    updateProfile, updateSettings, toggleTheme,
    newCoachChat, selectCoachChat, deleteCoachChat, sendCoachMessage,
    newNutritionChat, selectNutritionChat, deleteNutritionChat, sendNutritionMessage,
    resetApp
  }), [
    ready, state,
    addHabit, updateHabit, deleteHabit, toggleHabit,
    addTask, updateTask, toggleTask, deleteTask,
    goPrevMonth, goNextMonth, goThisMonth,
    addPost, togglePostLike, togglePostSave, togglePostRepost, addComment, deleteComment, editComment, deletePost, editPost,
    getUser, isFollowing, hasRequested, isBlocked,
    followUser, unfollowUser, acceptFollow, declineFollow, cancelFollowRequest,
    blockUser, unblockUser, reportPost,
    markNotifRead, markAllNotifsRead, unreadNotifCount,
    sendDM, markDMRead, unreadDMCount,
    updateProfile, updateSettings, toggleTheme,
    newCoachChat, selectCoachChat, deleteCoachChat, sendCoachMessage,
    newNutritionChat, selectNutritionChat, deleteNutritionChat, sendNutritionMessage,
    resetApp
  ]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return ctx;
}

// Convenience selectors
export function useToday() { return today(); }
