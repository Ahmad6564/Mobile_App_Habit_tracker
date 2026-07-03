/**
 * Lightweight API client for HabitForge backend.
 * Uses fetch + AsyncStorage for token management.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Set this to your machine's local IP when testing on a real device/Android emulator.
// Android emulator:  http://10.0.2.2:5000/api
// iOS simulator:     http://localhost:5000/api
// Physical device:   http://<YOUR_LAN_IP>:5000/api
const BASE_URL = "http://localhost:5000/api";

const KEYS = {
  accessToken:  "hf_access_token",
  refreshToken: "hf_refresh_token",
};

// ─── Token helpers ──────────────────────────────────────────────────────────

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

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = false
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = await TokenStorage.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr: unknown) {
    const msg =
      networkErr instanceof Error ? networkErr.message : String(networkErr);
    throw new ApiError(
      `Cannot reach the server. Make sure the backend is running and BASE_URL is correct. (${msg})`,
      0,
      "NETWORK_ERROR"
    );
  }

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`Server returned non-JSON response (${res.status})`, res.status, "PARSE_ERROR");
  }

  if (!res.ok) {
    const msg =
      (json?.error as any)?.message ?? (json?.message as string) ?? `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, (json?.error as any)?.code);
  }

  return json as T;
}

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

// ─── Auth API ────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  firstName:   string;
  lastName:    string;
  email:       string;
  password:    string;
  age:         number;
  gender:      string;
  dateOfBirth: string | null;
  timezone:    string;
}

export interface AuthUser {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
  username:  string;
  isVerified: boolean;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

export const AuthApi = {
  async register(payload: RegisterPayload): Promise<{ id: string; email: string; firstName: string; lastName: string }> {
    const res = await request<{ data: { id: string; email: string; firstName: string; lastName: string } }>(
      "POST", "/auth/register", payload
    );
    return res.data;
  },

  async login(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const res = await request<{ data: { user: AuthUser; tokens: AuthTokens } }>(
      "POST", "/auth/login", { email, password }
    );
    const { user, tokens } = res.data;
    await TokenStorage.save(tokens.accessToken, tokens.refreshToken);
    return { user, tokens };
  },

  async logout(): Promise<void> {
    try {
      await request("POST", "/auth/logout", undefined, true);
    } finally {
      await TokenStorage.clear();
    }
  },

  async resendVerification(email: string): Promise<void> {
    await request("POST", "/auth/resend-verification", { email });
  },
};
