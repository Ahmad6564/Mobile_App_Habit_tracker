import Joi from "joi";

const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

// ─── Create / Update ────────────────────────────────────────────────────────

export const createHabitSchema = Joi.object({
  name:     Joi.string().trim().min(1).max(100).required(),
  icon:     Joi.string().max(50).default("spark"),
  goal:     Joi.number().integer().min(1).required(),
  unit:     Joi.string().max(50).default("times"),
  category: Joi.string().max(50).default("General"),
  color:    Joi.string().max(30).default("#22d3ee"),
  schedule: Joi.array()
    .items(Joi.string().valid(...VALID_DAYS))
    .min(1)
    .default(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
});

export const updateHabitSchema = Joi.object({
  name:     Joi.string().trim().min(1).max(100),
  icon:     Joi.string().max(50),
  goal:     Joi.number().integer().min(1),
  unit:     Joi.string().max(50),
  category: Joi.string().max(50),
  color:    Joi.string().max(30),
  schedule: Joi.array().items(Joi.string().valid(...VALID_DAYS)).min(1),
}).min(1);

// ─── Log ─────────────────────────────────────────────────────────────────────

export const logHabitSchema = Joi.object({
  date:  Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().slice(0, 10)),
  value: Joi.number().min(0).required(),
  note:  Joi.string().max(500).allow("").default(""),
  mood:  Joi.string()
    .valid("great", "good", "okay", "bad", "terrible", "")
    .allow("")
    .default(""),
});

// ─── Query params ─────────────────────────────────────────────────────────────

export const logsQuerySchema = Joi.object({
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  to:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

export const matrixQuerySchema = Joi.object({
  year:  Joi.number().integer().min(2020).max(2100).default(() => new Date().getFullYear()),
  month: Joi.number().integer().min(0).max(11).default(() => new Date().getMonth()),
});
