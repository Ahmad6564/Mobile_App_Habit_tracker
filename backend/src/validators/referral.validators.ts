import Joi from "joi";

export const applyReferralSchema = Joi.object({
  code: Joi.string().max(20).required(),
});

export const leaderboardSchema = Joi.object({
  period: Joi.string().valid("week", "month", "all").default("all"),
  limit:  Joi.number().integer().min(1).max(100).default(20),
});
