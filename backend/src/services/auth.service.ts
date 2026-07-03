import crypto from "crypto";
import { User, IUser } from "../models/User";
import { TokenService } from "./token.service";
import { EmailService } from "./email.service";
import { Errors, AppError } from "../utils/AppError";
import { env } from "../config/env";

const tokenService = new TokenService();
const emailService = new EmailService();

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

export class AuthService {
  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    age: number,
    gender: string,
    dateOfBirth: string | null,
    timezone: string
  ): Promise<IUser> {
    // Auto-generate a unique username from name + random suffix
    const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, "");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const username = `${base.slice(0, 20)}${suffix}`;

    const existing = await User.findOne({ email });
    if (existing) throw Errors.conflict("email is already registered");

    const user = new User({
      username,
      email,
      passwordHash: password,
      firstName,
      lastName,
      age,
      gender,
      dateOfBirth: dateOfBirth || null,
      timezone,
    });
    await user.save();

    const verifyToken = tokenService.generateVerifyEmailToken(user._id.toString());
    await emailService.sendVerificationEmail(email, firstName, verifyToken);

    return user;
  }

  async login(email: string, password: string): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) throw Errors.unauthorized();

    const valid = await user.comparePassword(password);
    if (!valid) throw Errors.unauthorized();

    if (user.banned) throw new AppError("Account is banned", 403, "BANNED");
    if (user.isSuspended()) throw new AppError("Account is suspended", 403, "SUSPENDED");

    const tokens = await this.issueTokens(user);
    await User.findByIdAndUpdate(user._id, { lastSeenAt: new Date() });

    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = tokenService.verifyRefreshToken(refreshToken);
    const stored  = await tokenService.getStoredRefreshToken(payload.sub!);

    if (!stored || stored !== refreshToken) {
      throw Errors.unauthorized();
    }

    const user = await User.findById(payload.sub);
    if (!user || user.banned) throw Errors.unauthorized();

    return this.issueTokens(user);
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    await Promise.all([
      tokenService.deleteRefreshToken(userId),
      tokenService.blacklistAccessToken(accessToken),
    ]);
  }

  async verifyEmail(token: string): Promise<void> {
    const payload = tokenService.verifyEmailToken(token);
    const user    = await User.findById(payload.sub);
    if (!user) throw Errors.notFound("User");
    if (user.isVerified) return; // idempotent
    user.isVerified = true;
    await user.save();
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    // Always return success to prevent user enumeration
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString("hex");
    await tokenService.storePasswordResetToken(user._id.toString(), resetToken);
    await emailService.sendPasswordResetEmail(email, user.username, resetToken, user._id.toString());
  }

  async resetPassword(userId: string, token: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) throw Errors.notFound("User");

    const valid = await tokenService.verifyAndConsumePasswordResetToken(userId, token);
    if (!valid) throw new AppError("Invalid or expired reset token", 400, "INVALID_RESET_TOKEN");

    user.passwordHash = newPassword;
    await user.save();

    // Invalidate any existing refresh token
    await tokenService.deleteRefreshToken(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, accessToken: string): Promise<void> {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) throw Errors.notFound("User");

    const valid = await user.comparePassword(currentPassword);
    if (!valid) throw new AppError("Current password is incorrect", 400, "INVALID_PASSWORD");

    user.passwordHash = newPassword;
    await user.save();

    // Force re-login
    await tokenService.deleteRefreshToken(userId);
    await tokenService.blacklistAccessToken(accessToken);
  }

  private async issueTokens(user: IUser): Promise<AuthTokens> {
    const userId       = user._id.toString();
    const accessToken  = tokenService.generateAccessToken(userId, user.role);
    const refreshToken = tokenService.generateRefreshToken(userId, user.role);
    await tokenService.storeRefreshToken(userId, refreshToken);
    return { accessToken, refreshToken };
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await User.findOne({ email });
    // Always return success — prevents email enumeration
    if (!user || user.isVerified) return;

    const verifyToken = tokenService.generateVerifyEmailToken(user._id.toString());
    await emailService.sendVerificationEmail(user.email, user.firstName, verifyToken);
  }
}
