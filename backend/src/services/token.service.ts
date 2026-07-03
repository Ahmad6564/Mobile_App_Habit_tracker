import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { getRedis } from "../config/redis";
import { User, IUser } from "../models/User";
import { Errors } from "../utils/AppError";

export interface TokenPayload extends JwtPayload {
  sub:  string;   // userId
  role: string;
  type: "access" | "refresh" | "verify";
}

const ACCESS_TTL_SECONDS  = 15 * 60;       // 15 min
const REFRESH_TTL_SECONDS = 7 * 24 * 3600; // 7 days

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
    await getRedis().set(`rt:${userId}`, token, "EX", REFRESH_TTL_SECONDS);
  }

  async getStoredRefreshToken(userId: string): Promise<string | null> {
    return getRedis().get(`rt:${userId}`);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await getRedis().del(`rt:${userId}`);
  }

  // ─── Blacklist (logout) ────────────────────────────────────────────────────

  async blacklistAccessToken(token: string): Promise<void> {
    await getRedis().set(`bl:${token}`, "1", "EX", ACCESS_TTL_SECONDS);
  }

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const val = await getRedis().get(`bl:${token}`);
    return val !== null;
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
    await getRedis().set(`pr:${userId}`, token, "EX", 60 * 60); // 1 hour
  }

  async verifyAndConsumePasswordResetToken(userId: string, token: string): Promise<boolean> {
    const stored = await getRedis().get(`pr:${userId}`);
    if (!stored || stored !== token) return false;
    await getRedis().del(`pr:${userId}`);
    return true;
  }

  // ─── Helper: resolve user from token payload ──────────────────────────────

  async getUserFromPayload(payload: TokenPayload): Promise<IUser | null> {
    if (!payload.sub) return null;
    return User.findById(payload.sub).select("+passwordHash");
  }
}
