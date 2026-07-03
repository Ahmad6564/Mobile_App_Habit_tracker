import { Router, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { sendSuccess } from "../utils/response";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  googleAuthSchema,
} from "../validators/auth.validators";

const router  = Router();
const service = new AuthService();

// POST /api/auth/register
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, age, gender, dateOfBirth, timezone } = req.body as {
      firstName: string; lastName: string; email: string; password: string;
      age: number; gender: string; dateOfBirth: string | null; timezone: string;
    };
    const user = await service.register(firstName, lastName, email, password, age, gender, dateOfBirth ?? null, timezone);
    sendSuccess(
      res,
      { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      201,
      "Registration successful. Please check your email to verify your account (link expires in 10 minutes)."
    );
  })
);

// POST /api/auth/login
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const { user, tokens }    = await service.login(email, password);
    sendSuccess(res, { user, tokens }, 200, "Login successful");
  })
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as { refreshToken: string };
    const tokens = await service.refresh(refreshToken);
    sendSuccess(res, tokens, 200);
  })
);

// POST /api/auth/logout
router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization!.slice(7);
    await service.logout(req.user!._id.toString(), token);
    sendSuccess(res, null, 200, "Logged out successfully");
  })
);

// POST /api/auth/verify-email
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const { token } = req.body as { token: string };
    await service.verifyEmail(token);
    sendSuccess(res, null, 200, "Email verified successfully");
  })
);

// POST /api/auth/resend-verification
router.post(
  "/resend-verification",
  authLimiter,
  validate(forgotPasswordSchema), // reuse { email } schema
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    await service.resendVerificationEmail(email);
    sendSuccess(res, null, 200, "If that email exists and is unverified, a new link has been sent (expires in 10 minutes)");
  })
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    await service.forgotPassword(email);
    sendSuccess(res, null, 200, "If that email exists, a reset link has been sent");
  })
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password, userId } = req.body as { token: string; password: string; userId: string };
    await service.resetPassword(userId, token, password);
    sendSuccess(res, null, 200, "Password reset successfully");
  })
);

// POST /api/auth/change-password
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    const accessToken = req.headers.authorization!.slice(7);
    await service.changePassword(req.user!._id.toString(), currentPassword, newPassword, accessToken);
    sendSuccess(res, null, 200, "Password changed. Please log in again.");
  })
);

// POST /api/auth/google
router.post(
  "/google",
  authLimiter,
  validate(googleAuthSchema),
  asyncHandler(async (req, res) => {
    const { idToken } = req.body as { idToken: string };
    const { user, tokens, isNewUser } = await service.googleAuth(idToken);
    sendSuccess(
      res,
      { user, tokens, isNewUser },
      200,
      isNewUser ? "Account created with Google" : "Login successful"
    );
  })
);

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, req.user!, 200);
  })
);

export default router;
