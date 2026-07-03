import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { AppError } from "../utils/AppError";

type ValidationTarget = "body" | "query" | "params";

export function validate(schema: Schema, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join("; ");
      return next(new AppError(message, 422, "VALIDATION_ERROR"));
    }

    req[target] = value;
    next();
  };
}
