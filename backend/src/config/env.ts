import Joi from "joi";
import dotenv from "dotenv";
dotenv.config();

const schema = Joi.object({
  NODE_ENV:               Joi.string().valid("development", "production", "test").default("development"),
  PORT:                   Joi.number().default(5000),
  MONGODB_URI:            Joi.string().required(),
  REDIS_URL:              Joi.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET:      Joi.string().min(32).required(),
  JWT_REFRESH_SECRET:     Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN:  Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  SMTP_HOST:              Joi.string().required(),
  SMTP_PORT:              Joi.number().default(587),
  SMTP_USER:              Joi.string().required(),
  SMTP_PASS:              Joi.string().required(),
  EMAIL_FROM:             Joi.string().email().required(),
  APP_URL:                Joi.string().uri().required(),
  CLIENT_URL:             Joi.string().uri().required(),
  // AWS S3 — optional; media upload endpoints return error if not set
  AWS_REGION:             Joi.string().default(""),
  AWS_ACCESS_KEY_ID:      Joi.string().default(""),
  AWS_SECRET_ACCESS_KEY:  Joi.string().default(""),
  AWS_S3_BUCKET:          Joi.string().default(""),
  // OpenAI — optional; AI Coach returns 503 if not set
  OPENAI_API_KEY:         Joi.string().default(""),
  // Firebase Admin — optional; push notifications disabled if not set
  FIREBASE_SERVICE_ACCOUNT_JSON: Joi.string().default(""),
}).unknown(true);

const { error, value } = schema.validate(process.env);
if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

export const env = {
  nodeEnv:   value.NODE_ENV as string,
  port:      value.PORT as number,
  mongoUri:  value.MONGODB_URI as string,
  redisUrl:  value.REDIS_URL as string,
  jwt: {
    accessSecret:      value.JWT_ACCESS_SECRET as string,
    refreshSecret:     value.JWT_REFRESH_SECRET as string,
    accessExpiresIn:   value.JWT_ACCESS_EXPIRES_IN as string,
    refreshExpiresIn:  value.JWT_REFRESH_EXPIRES_IN as string,
  },
  smtp: {
    host: value.SMTP_HOST as string,
    port: value.SMTP_PORT as number,
    user: value.SMTP_USER as string,
    pass: value.SMTP_PASS as string,
    from: value.EMAIL_FROM as string,
  },
  appUrl:    value.APP_URL as string,
  clientUrl: value.CLIENT_URL as string,
  isDev:     value.NODE_ENV === "development",
  isProd:    value.NODE_ENV === "production",
  aws: {
    region:          value.AWS_REGION          as string,
    accessKeyId:     value.AWS_ACCESS_KEY_ID   as string,
    secretAccessKey: value.AWS_SECRET_ACCESS_KEY as string,
    s3Bucket:        value.AWS_S3_BUCKET       as string,
  },
  openaiApiKey:   value.OPENAI_API_KEY as string,
  firebase: {
    serviceAccountJson: value.FIREBASE_SERVICE_ACCOUNT_JSON as string,
  },
};
