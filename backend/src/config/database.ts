import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export async function connectDB(): Promise<void> {
  mongoose.connection.on("connected",    () => logger.info("MongoDB connected"));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("error",  (err) => logger.error("MongoDB error", { err }));

  await mongoose.connect(env.mongoUri, {
    maxPoolSize:              10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS:          45000,
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected gracefully");
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
