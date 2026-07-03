import Joi from "joi";

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
  .message(
    "Password must be at least 8 characters and include uppercase, lowercase, a digit, and a special character"
  );

export const registerSchema = Joi.object({
  firstName:   Joi.string().trim().min(1).max(60).required(),
  lastName:    Joi.string().trim().min(1).max(60).required(),
  email:       Joi.string().email().max(255).required(),
  password:    passwordRule.required(),
  age:         Joi.number().integer().min(1).max(120).required(),
  gender:      Joi.string().valid("male", "female", "non-binary", "prefer-not-to-say").required(),
  dateOfBirth: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, "").default(null),
  timezone:    Joi.string().max(60).default("UTC"),
});

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token:    Joi.string().required(),
  password: passwordRule.required(),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     passwordRule.required(),
});
