import Joi from "joi";

export const createJourneySchema = Joi.object({
  challenge:  Joi.string().max(5000).required(),
  helped:     Joi.string().max(5000).required(),
  overcame:   Joi.string().max(5000).required(),
  habitTags:  Joi.array().items(Joi.string().trim().max(50)).max(10).default([]),
  visibility: Joi.string().valid("public", "community", "private").default("public"),
});

export const updateJourneySchema = Joi.object({
  challenge:  Joi.string().max(5000).optional(),
  helped:     Joi.string().max(5000).optional(),
  overcame:   Joi.string().max(5000).optional(),
  habitTags:  Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
  visibility: Joi.string().valid("public", "community", "private").optional(),
}).min(1);

export const journeyCommentSchema = Joi.object({
  text: Joi.string().max(2000).required(),
});

export const journeyPaginationSchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});
