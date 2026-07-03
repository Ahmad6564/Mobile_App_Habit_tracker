import { initializeApp, App, cert } from "firebase-admin/app";
import { getMessaging as fbGetMessaging, Messaging } from "firebase-admin/messaging";
import { env } from "./env";
import { logger } from "../utils/logger";

let _app: App | null = null;

export function initFirebase(): void {
  if (!env.firebase.serviceAccountJson) {
    logger.info("Firebase not configured — push notifications disabled");
    return;
  }

  try {
    const serviceAccount = JSON.parse(env.firebase.serviceAccountJson);
    _app = initializeApp({ credential: cert(serviceAccount) });
    logger.info("Firebase Admin initialized");
  } catch (err) {
    logger.warn("Firebase Admin init failed — push notifications disabled", { err });
  }
}

/** Returns the Firebase Messaging instance, or null if not configured */
export function getMessaging(): Messaging | null {
  return _app ? fbGetMessaging(_app) : null;
}
