import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { getRedis, isRedisAvailable } from "../config/redis";
import { User, IUser } from "../models/User";
import { Errors } from "../utils/AppError";

export interface TokenPayload extends JwtPayload {
  sub:  string;   // userId
  role: string;
  type: "access" | "refresh" | "verify";
}

const ACCESS_TTL_SECONDS  = 15 * 60;       // 15 min
const REFRESH_TTL_SECONDS = 7 * 24 * 3600; // 7 days

// In-memory fallback when Redis is unavailable (development only)
const memStore = new Map<string, { value: string; expiresAt: number }>();

function memSet(key: string, value: string, ttlSeconds: number): void {
  memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memGet(key: string): string | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
  return entry.value;
}

function memDel(key: string): void {
  memStore.delete(key);
}

export class TokenService {
  // ─── Access token ──────────────────────────────────────────────────────────

  generateAccessToken(userId: string, role: string): string {
    const options: SignOptions = { expiresIn: ACCESS_TTL_SECONDS };
    return jwt.sign(
      { sub: userId, role, type: "access" } satisfies Omit<TokenPayload, keyof JwtPayload>,
      env.jwt.accessSecret,
      options
    );
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.jwt.accessSecret) as TokenPayload;
  }

  // ─── Refresh token ─────────────────────────────────────────────────────────

  generateRefreshToken(userId: string, role: string): string {
    const options: SignOptions = { expiresIn: REFRESH_TTL_SECONDS };
    return jwt.sign(
      { sub: userId, role, type: "refresh" } satisfies Omit<TokenPayload, keyof JwtPayload>,
      env.jwt.refreshSecret,
      options
    );
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.jwt.refreshSecret) as TokenPayload;
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    if (isRedisAvailable()) {
      await getRedis().set(`rt:${userId}`, token, "EX", REFRESH_TTL_SECONDS);
    } else {
      memSet(`rt:${userId}`, token, REFRESH_TTL_SECONDS);
    }
  }

  async getStoredRefreshToken(userId: string): Promise<string | null> {
    if (isRedisAvailable()) return getRedis().get(`rt:${userId}`);
    return memGet(`rt:${userId}`);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    if (isRedisAvailable()) { await getRedis().del(`rt:${userId}`); }
    else { memDel(`rt:${userId}`); }
  }

  // ─── Blacklist (logout) ────────────────────────────────────────────────────

  async blacklistAccessToken(token: string): Promise<void> {
    if (isRedisAvailable()) {
      await getRedis().set(`bl:${token}`, "1", "EX", ACCESS_TTL_SECONDS);
    } else {
      memSet(`bl:${token}`, "1", ACCESS_TTL_SECONDS);
    }
  }

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    if (isRedisAvailable()) {
      const val = await getRedis().get(`bl:${token}`);
      return val !== null;
    }
    return memGet(`bl:${token}`) !== null;
  }

  // ─── Email verification token ──────────────────────────────────────────────

  generateVerifyEmailToken(userId: string): string {
    const options: SignOptions = { expiresIn: 10 * 60 }; // 10 minutes
    return jwt.sign(
      { sub: userId, type: "verify" } satisfies Omit<TokenPayload, keyof JwtPayload | "role">,
      env.jwt.accessSecret,
      options
    );
  }

  verifyEmailToken(token: string): TokenPayload {
    const payload = jwt.verify(token, env.jwt.accessSecret) as TokenPayload;
    if (payload.type !== "verify") throw Errors.unauthorized();
    return payload;
  }

  // ─── Password reset token (stored in Redis, single use) ───────────────────

  async storePasswordResetToken(userId: string, token: string): Promise<void> {
    if (isRedisAvailable()) {
      await getRedis().set(`pr:${userId}`, token, "EX", 60 * 60);
    } else {
      memSet(`pr:${userId}`, token, 60 * 60);
    }
  }

  async verifyAndConsumePasswordResetToken(userId: string, token: string): Promise<boolean> {
    if (isRedisAvailable()) {
      const stored = await getRedis().get(`pr:${userId}`);
      if (!stored || stored !== token) return false;
      await getRedis().del(`pr:${userId}`);
      return true;
    }
    const stored = memGet(`pr:${userId}`);
    if (!stored || stored !== token) return false;
    memDel(`pr:${userId}`);
    return true;
  }

  // ─── Helper: resolve user from token payload ──────────────────────────────

  async getUserFromPayload(payload: TokenPayload): Promise<IUser | null> {
    if (!payload.sub) return null;
    return User.findById(payload.sub).select("+passwordHash");
  }
}
