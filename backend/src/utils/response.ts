import { Response } from "express";

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  pagination?: PaginationMeta
): void {
  res.status(statusCode).json({
    success: true,
    message: message ?? null,
    data,
    pagination: pagination ?? null,
    error: null,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string
): void {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    pagination: null,
    error: { code: code ?? "SERVER_ERROR", message },
  });
}
