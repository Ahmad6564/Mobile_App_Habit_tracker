import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/response";
import { logger } from "../utils/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational errors (AppError)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message).join(", ");
    sendError(res, messages, 422, "VALIDATION_ERROR");
    return;
  }

  // Mongoose CastError (invalid ObjectId etc.)
  if (err instanceof MongooseError.CastError) {
    sendError(res, `Invalid ${err.path}: ${err.value}`, 400, "INVALID_ID");
    return;
  }

  // MongoDB duplicate key
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === 11000
  ) {
    const field = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0] ?? "field";
    sendError(res, `${field} already exists`, 409, "DUPLICATE_KEY");
    return;
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    sendError(res, "Token has expired", 401, "TOKEN_EXPIRED");
    return;
  }
  if (err instanceof JsonWebTokenError) {
    sendError(res, "Invalid token", 401, "INVALID_TOKEN");
    return;
  }

  // Unexpected error — do not leak details
  logger.error("Unhandled error", { err });
  sendError(res, "Internal server error", 500, "SERVER_ERROR");
}

// Catch async errors — wrap async route handlers
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
