import { Request, Response, NextFunction } from "express";
import { TokenService } from "../services/token.service";
import { Errors } from "../utils/AppError";
import { IUser } from "../models/User";

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const tokenService = new TokenService();

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(Errors.unauthorized());
    }

    const token = authHeader.slice(7);

    // Check if token has been blacklisted (logout)
    const isBlacklisted = await tokenService.isAccessTokenBlacklisted(token);
    if (isBlacklisted) {
      return next(Errors.unauthorized());
    }

    const payload = tokenService.verifyAccessToken(token);
    const user = await tokenService.getUserFromPayload(payload);
    if (!user) {
      return next(Errors.unauthorized());
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(Errors.unauthorized());
    if (!roles.includes(req.user.role)) return next(Errors.forbidden());
    next();
  };
}
