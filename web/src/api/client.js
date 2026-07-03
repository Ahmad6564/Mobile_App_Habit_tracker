/**
 * HabitForge Web API Client
 * Handles all HTTP communication with the backend, token management, and auto-refresh.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEYS = {
  access: "hf_access_token",
  refresh: "hf_refresh_token",
};

// ─── Token Storage ───────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEYS.access),
  getRefresh: () => localStorage.getItem(TOKEN_KEYS.refresh),
  save(access, refresh) {
    localStorage.setItem(TOKEN_KEYS.access, access);
    localStorage.setItem(TOKEN_KEYS.refresh, refresh);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
  },
};

// ─── Core Request ────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

async function refreshTokens() {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    tokenStorage.clear();
    throw new Error("Session expired");
  }

  const json = await res.json();
  const { accessToken, refreshToken: newRefresh } = json.data;
  tokenStorage.save(accessToken, newRefresh);
  return accessToken;
}

export class ApiError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Core fetch wrapper with automatic token attachment and refresh.
 */
export async function request(method, path, { body, auth = true, query } = {}) {
  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = tokenStorage.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      "Cannot reach the server. Check your connection.",
      0,
      "NETWORK_ERROR"
    );
  }

  // Handle 401 with token refresh
  if (res.status === 401 && auth) {
    const errorJson = await res.json().catch(() => ({}));
    const code = errorJson?.error?.code;

    if (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN") {
      if (isRefreshing) {
        // Wait for ongoing refresh
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          headers["Authorization"] = `Bearer ${newToken}`;
          return fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
          }).then(handleResponse);
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshTokens();
        processQueue(null, newToken);
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      } catch (err) {
        processQueue(err, null);
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent("auth:logout"));
        throw new ApiError("Session expired. Please sign in again.", 401, "SESSION_EXPIRED");
      } finally {
        isRefreshing = false;
      }
    }
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`Server returned non-JSON (${res.status})`, res.status, "PARSE_ERROR");
  }

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `Request failed (${res.status})`;
    const code = json?.error?.code || "UNKNOWN";
    throw new ApiError(msg, res.status, code);
  }

  return json;
}

// ─── Convenience methods ─────────────────────────────────────────────────────

export const api = {
  get: (path, opts) => request("GET", path, { auth: true, ...opts }),
  post: (path, body, opts) => request("POST", path, { body, auth: true, ...opts }),
  patch: (path, body, opts) => request("PATCH", path, { body, auth: true, ...opts }),
  del: (path, opts) => request("DELETE", path, { auth: true, ...opts }),
};
