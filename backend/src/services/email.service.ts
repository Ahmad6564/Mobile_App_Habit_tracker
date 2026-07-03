import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
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
    const link = `${env.clientUrl}/reset-password?token=${token}&id=${userId}`;
    await this.send(to, "Reset your HabitForge password", `
      <h2>Hi ${username},</h2>
      <p>We received a request to reset your password.</p>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p>This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
    `);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
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
