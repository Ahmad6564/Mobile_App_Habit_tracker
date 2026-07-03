import Joi from "joi";

export const analyzeSchema = Joi.object({
  imageUrl: Joi.string().uri().required(),
  mealType: Joi.string().valid("breakfast", "lunch", "dinner", "snack").default("snack"),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const correctSchema = Joi.object({
  correctedResult: Joi.object({
    meal:        Joi.string().required(),
    confidence:  Joi.number().min(0).max(1).required(),
    calories:    Joi.number().min(0).required(),
    protein:     Joi.number().min(0).required(),
    carbs:       Joi.number().min(0).required(),
    fat:         Joi.number().min(0).required(),
    fiber:       Joi.number().min(0).required(),
    items:       Joi.array().items(
      Joi.object({ name: Joi.string(), calories: Joi.number(), portion: Joi.string() })
    ).default([]),
    suggestions: Joi.array().items(Joi.string()).default([]),
  }).required(),
});

export const nutritionChatMessageSchema = Joi.object({
  text:     Joi.string().max(2000).required(),
  imageUrl: Joi.string().uri().optional(),
});

export const dateRangeSchema = Joi.object({
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

export const dailyLogSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});
