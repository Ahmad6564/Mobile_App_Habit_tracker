export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common pre-built errors
export const Errors = {
  notFound:      (resource = "Resource") => new AppError(`${resource} not found`, 404, "NOT_FOUND"),
  unauthorized:  ()  => new AppError("Unauthorized", 401, "UNAUTHORIZED"),
  forbidden:     ()  => new AppError("Forbidden", 403, "FORBIDDEN"),
  conflict:      (m: string) => new AppError(m, 409, "CONFLICT"),
  badRequest:    (m: string) => new AppError(m, 400, "BAD_REQUEST"),
  tooManyRequests: () => new AppError("Too many requests", 429, "RATE_LIMIT"),
};
