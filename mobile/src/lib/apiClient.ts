/**
 * HabitForge Mobile API Client
 * Full-featured client with token refresh, all resource APIs.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Configure for your environment ──────────────────────────────────────────
// Set EXPO_PUBLIC_API_URL in mobile/.env (e.g. http://10.0.2.2:5000/api for the
// Android emulator, http://localhost:5000/api for the iOS simulator, or your LAN
// IP for a physical device). Falls back to a dev LAN IP when unset.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://172.25.106.175:5000/api";

const KEYS = {
  accessToken: "hf_access_token",
  refreshToken: "hf_refresh_token",
};

// ─── Token Storage ───────────────────────────────────────────────────────────

export const TokenStorage = {
  async save(access: string, refresh: string) {
    await AsyncStorage.multiSet([
      [KEYS.accessToken, access],
      [KEYS.refreshToken, refresh],
    ]);
  },
  async getAccess(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.accessToken);
  },
  async getRefresh(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.refreshToken);
  },
  async clear() {
    await AsyncStorage.multiRemove([KEYS.accessToken, KEYS.refreshToken]);
  },
};

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Token refresh logic ─────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
}

async function refreshTokens(): Promise<string> {
  const refreshToken = await TokenStorage.getRefresh();
  if (!refreshToken) throw new ApiError("No refresh token", 401, "NO_REFRESH");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await TokenStorage.clear();
    throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
  }

  const json = await res.json();
  const { accessToken, refreshToken: newRefresh } = json.data;
  await TokenStorage.save(accessToken, newRefresh);
  return accessToken;
}

// ─── Core request ────────────────────────────────────────────────────────────

interface RequestOptions {
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined | null>;
}

async function request<T = any>(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { body, auth = true, query } = opts;

  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = await TokenStorage.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr: unknown) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    throw new ApiError(`Cannot reach the server. (${msg})`, 0, "NETWORK_ERROR");
  }

  // Handle 401 with auto-refresh
  if (res.status === 401 && auth) {
    const errorJson = await res.json().catch(() => ({}));
    const code = (errorJson as any)?.error?.code;

    if (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN") {
      if (isRefreshing) {
        const newToken = await new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        });
        headers["Authorization"] = `Bearer ${newToken}`;
        return handleResponse<T>(
          await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
        );
      }

      isRefreshing = true;
      try {
        const newToken = await refreshTokens();
        processQueue(null, newToken);
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      } catch (err) {
        processQueue(err, null);
        await TokenStorage.clear();
        throw new ApiError("Session expired. Please sign in again.", 401, "SESSION_EXPIRED");
      } finally {
        isRefreshing = false;
      }
    }
  }

  return handleResponse<T>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`Server returned non-JSON (${res.status})`, res.status, "PARSE_ERROR");
  }

  if (!res.ok) {
    const msg = json?.error?.message ?? json?.message ?? `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, json?.error?.code);
  }

  return json as T;
}

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  isVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  dateOfBirth: string | null;
  timezone: string;
}

export interface Habit {
  _id: string;
  name: string;
  icon: string;
  goal: number;
  unit: string;
  category: string;
  color: string;
  schedule: string[];
  archived: boolean;
  createdAt: string;
  streak?: { currentStreak: number; longestStreak: number; lastLogDate: string | null } | null;
  logs?: Record<string, number>;
}

export interface HabitLog {
  _id: string;
  habitId: string;
  date: string;
  value: number;
  completed: boolean;
  note?: string;
  mood?: string;
}

export interface Task {
  _id: string;
  title: string;
  notes: string;
  due: string | null;
  priority: "low" | "medium" | "high";
  done: boolean;
  doneAt: string | null;
  createdAt: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string;
  timezone: string;
  dateOfBirth: string | null;
  age: number;
  gender: string;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  referralCode: string;
  privacy: string;
  followers: string[];
  following: string[];
  settings: { notifications: boolean; reminderTime: string };
  createdAt: string;
}

export interface HabitSummary {
  todayDone: number;
  todayTotal: number;
  todayPct: number;
  monthAvgPct: number;
  longestActiveStreak: number;
  topHabits: Array<{ id: string; name: string; icon: string; color: string; currentStreak: number }>;
}

export interface TaskSummary {
  all: number;
  open: number;
  done: number;
  today: number;
  overdue: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export const AuthApi = {
  async register(payload: RegisterPayload) {
    const res = await request<{ data: { id: string; email: string; firstName: string; lastName: string } }>(
      "POST", "/auth/register", { body: payload, auth: false }
    );
    return res.data;
  },

  async login(email: string, password: string) {
    const res = await request<{ data: { user: AuthUser; tokens: AuthTokens } }>(
      "POST", "/auth/login", { body: { email, password }, auth: false }
    );
    const { user, tokens } = res.data;
    await TokenStorage.save(tokens.accessToken, tokens.refreshToken);
    return { user, tokens };
  },

  async googleLogin(idToken: string) {
    const res = await request<{ data: { user: AuthUser; tokens: AuthTokens; isNewUser: boolean } }>(
      "POST", "/auth/google", { body: { idToken }, auth: false }
    );
    const { user, tokens, isNewUser } = res.data;
    await TokenStorage.save(tokens.accessToken, tokens.refreshToken);
    return { user, tokens, isNewUser };
  },

  async logout() {
    try {
      await request("POST", "/auth/logout");
    } finally {
      await TokenStorage.clear();
    }
  },

  async getMe() {
    const res = await request<{ data: AuthUser }>("GET", "/auth/me");
    return res.data;
  },

  async resendVerification(email: string) {
    await request("POST", "/auth/resend-verification", { body: { email }, auth: false });
  },

  async forgotPassword(email: string) {
    await request("POST", "/auth/forgot-password", { body: { email }, auth: false });
  },

  async resetPassword(userId: string, token: string, password: string) {
    await request("POST", "/auth/reset-password", { body: { userId, token, password }, auth: false });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await request("POST", "/auth/change-password", { body: { currentPassword, newPassword } });
  },
};

// ─── Habits API ──────────────────────────────────────────────────────────────

export const HabitsApi = {
  async list() {
    const res = await request<{ data: Habit[] }>("GET", "/habits");
    return res.data;
  },

  async getPresets() {
    const res = await request<{ data: any[] }>("GET", "/habits/presets");
    return res.data;
  },

  async getSummary() {
    const res = await request<{ data: HabitSummary }>("GET", "/habits/summary");
    return res.data;
  },

  async getMatrix(year: number, month: number) {
    const res = await request<{ data: any }>("GET", "/habits/matrix", { query: { year, month } });
    return res.data;
  },

  async getArchived() {
    const res = await request<{ data: Habit[] }>("GET", "/habits/archived");
    return res.data;
  },

  async getById(id: string) {
    const res = await request<{ data: any }>("GET", `/habits/${id}`);
    return res.data;
  },

  async create(payload: { name: string; goal: number; icon?: string; unit?: string; category?: string; color?: string; schedule?: string[] }) {
    const res = await request<{ data: { habit: Habit; streak: any } }>("POST", "/habits", { body: payload });
    return res.data;
  },

  async update(id: string, payload: Partial<{ name: string; goal: number; icon: string; unit: string; category: string; color: string; schedule: string[] }>) {
    const res = await request<{ data: Habit }>("PATCH", `/habits/${id}`, { body: payload });
    return res.data;
  },

  async archive(id: string) {
    await request("DELETE", `/habits/${id}`);
  },

  async restore(id: string) {
    const res = await request<{ data: Habit }>("POST", `/habits/${id}/restore`);
    return res.data;
  },

  async log(id: string, payload: { date?: string; value: number; note?: string; mood?: string }) {
    const res = await request<{ data: { log: HabitLog; streak: any } }>("POST", `/habits/${id}/log`, { body: payload });
    return res.data;
  },

  async deleteLog(id: string, date: string) {
    const res = await request<{ data: any }>("DELETE", `/habits/${id}/log/${date}`);
    return res.data;
  },

  async getLogs(id: string, from?: string, to?: string) {
    const res = await request<{ data: HabitLog[] }>("GET", `/habits/${id}/logs`, { query: { from, to } });
    return res.data;
  },

  async getAnalytics(id: string) {
    const res = await request<{ data: any }>("GET", `/habits/${id}/analytics`);
    return res.data;
  },

  async useShield(id: string) {
    const res = await request<{ data: any }>("POST", `/habits/${id}/shield`);
    return res.data;
  },
};

// ─── Tasks API ───────────────────────────────────────────────────────────────

export const TasksApi = {
  async list(opts?: { status?: string; due?: string; page?: number; limit?: number }) {
    const res = await request<{ data: Task[]; pagination: Pagination }>(
      "GET", "/tasks", { query: opts as any }
    );
    return { tasks: res.data, pagination: res.pagination };
  },

  async getSummary() {
    const res = await request<{ data: TaskSummary }>("GET", "/tasks/summary");
    return res.data;
  },

  async create(payload: { title: string; notes?: string; due?: string | null; priority?: string }) {
    const res = await request<{ data: Task }>("POST", "/tasks", { body: payload });
    return res.data;
  },

  async update(id: string, payload: Partial<{ title: string; notes: string; due: string | null; priority: string; done: boolean }>) {
    const res = await request<{ data: Task }>("PATCH", `/tasks/${id}`, { body: payload });
    return res.data;
  },

  async toggle(id: string) {
    const res = await request<{ data: Task }>("PATCH", `/tasks/${id}/toggle`);
    return res.data;
  },

  async remove(id: string) {
    await request("DELETE", `/tasks/${id}`);
  },
};

// ─── Users API ───────────────────────────────────────────────────────────────

export const UsersApi = {
  async getMe() {
    const res = await request<{ data: UserProfile }>("GET", "/users/me");
    return res.data;
  },

  async updateProfile(payload: Partial<{ username: string; bio: string; avatarUrl: string | null; timezone: string }>) {
    const res = await request<{ data: UserProfile }>("PATCH", "/users/me", { body: payload });
    return res.data;
  },

  async deleteAccount() {
    await request("DELETE", "/users/me");
  },

  async search(q: string, opts?: { page?: number; limit?: number }) {
    const res = await request<{ data: any[]; pagination: Pagination }>(
      "GET", "/users/search", { query: { q, ...opts } as any }
    );
    return { users: res.data, pagination: res.pagination };
  },

  async getByUsername(username: string) {
    const res = await request<{ data: any }>("GET", `/users/${username}`);
    return res.data;
  },

  async follow(username: string) {
    const res = await request<{ data: any }>("POST", `/users/${username}/follow`);
    return res.data;
  },

  async unfollow(username: string) {
    await request("DELETE", `/users/${username}/follow`);
  },

  async registerPushToken(token: string, platform: string) {
    await request("POST", "/users/me/push-token", { body: { token, platform } });
  },

  async removePushToken(token: string) {
    await request("DELETE", "/users/me/push-token", { body: { token } });
  },
};

// ─── Health API ──────────────────────────────────────────────────────────────

export const HealthApi = {
  async check() {
    const res = await request<{ data: { status: string; mongo: string; redis: string } }>(
      "GET", "/health", { auth: false }
    );
    return res.data;
  },
};
