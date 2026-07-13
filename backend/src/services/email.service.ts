import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export class EmailService {
  private transporter: Transporter | null;

  constructor() {
    const host = env.smtp.host;
    // Skip transport if SMTP is not configured or using a fake host
    if (!host || host.includes(".local") || host === "localhost" || host === "smtp.test") {
      logger.warn("Email transporter not configured — emails will be skipped");
      this.transporter = null;
      return;
    }
    try {
      this.transporter = nodemailer.createTransport({
        host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.pass,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
    } catch (err) {
      logger.warn("Email transporter creation failed — emails will be skipped");
      this.transporter = null;
    }
  }

  async sendVerificationEmail(to: string, firstName: string, token: string): Promise<void> {
    const link = `${env.clientUrl}/verify-email?token=${token}`;
    await this.send(to, "Verify your HabitForge email", `
      <h2>Welcome to HabitForge, ${firstName}!</h2>
      <p>Click the button below to verify your email address.</p>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p><strong>This link expires in 10 minutes.</strong> If it expires, you can request a new one from the app.</p>
      <p>If you didn't create a HabitForge account, you can safely ignore this email.</p>
    `);
  }

  async sendPasswordResetEmail(to: string, username: string, token: string, userId: string): Promise<void> {
    // Deep link that opens the mobile app directly on the Reset Password screen.
    // The app registers the "habitforge" scheme (see mobile/app.json).
    const link = `habitforge://reset-password?token=${encodeURIComponent(token)}&id=${encodeURIComponent(userId)}`;
    // Dev convenience: surface the reset deep link in the server console so the flow
    // can be tested without a working SMTP transport. Never logged in production.
    if (env.isDev) {
      logger.info(`[DEV] Password reset link for ${to}: ${link}`);
    }
    await this.send(to, "Reset your HabitForge password", `
      <h2>Hi ${username},</h2>
      <p>We received a request to reset your password. Open this email on the device
      where HabitForge is installed and tap the button below.</p>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p style="color:#667;font-size:12px;margin-top:12px;">
        If the button doesn't open the app, copy this link into your device browser:<br>${link}
      </p>
      <p>This link expires in 1 hour and can be used once. If you didn't request a password reset, you can ignore this email.</p>
    `);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      logger.warn("Skipping email (no transporter)", { to, subject });
      return;
    }
    try {
      await this.transporter.sendMail({
        from:    `HabitForge <${env.smtp.from}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      logger.error("Failed to send email", { to, subject, err });
      // Do not throw — email failures should not crash the request flow
    }
  }
}
