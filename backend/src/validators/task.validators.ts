import Joi from "joi";

// ─── Create / Update ─────────────────────────────────────────────────────────

export const createTaskSchema = Joi.object({
  title:    Joi.string().trim().min(1).max(300).required(),
  notes:    Joi.string().max(2000).allow("").default(""),
  due:      Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, "").default(null),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
});

export const updateTaskSchema = Joi.object({
  title:    Joi.string().trim().min(1).max(300),
  notes:    Joi.string().max(2000).allow(""),
  due:      Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, ""),
  priority: Joi.string().valid("low", "medium", "high"),
  done:     Joi.boolean(),
}).min(1);

// ─── Query params ─────────────────────────────────────────────────────────────

export const listTasksSchema = Joi.object({
  status: Joi.string()
    .valid("all", "open", "done", "today", "overdue")
    .default("all"),
  due:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});
