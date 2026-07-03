import Joi from "joi";

export const submitReportSchema = Joi.object({
  targetType:  Joi.string().valid("post", "comment", "user", "journey").required(),
  targetId:    Joi.string().required(),
  reason:      Joi.string().valid("spam", "harassment", "misinformation", "inappropriate", "other").required(),
  description: Joi.string().max(1000).default(""),
});

export const reviewReportSchema = Joi.object({
  status: Joi.string().valid("reviewed", "actioned", "dismissed").required(),
  action: Joi.string().max(500).optional(),
});

export const suspendUserSchema = Joi.object({
  days:   Joi.number().integer().min(1).max(365).required(),
  reason: Joi.string().max(500).optional(),
});

export const banUserSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

export const adminPaginationSchema = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid("pending", "reviewed", "actioned", "dismissed", "all").default("pending"),
});
