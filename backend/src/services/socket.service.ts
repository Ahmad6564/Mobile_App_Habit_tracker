import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedis, isRedisAvailable } from "../config/redis";
import { TokenService } from "./token.service";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Types } from "mongoose";
import { logger } from "../utils/logger";
import { env } from "../config/env";

// ─── Singleton IO instance ────────────────────────────────────────────────────
let _io: Server | null = null;

export function getIO(): Server {
  if (!_io) throw new Error("Socket.IO not initialized — call setupSocket() first");
  return _io;
}

// ─── Presence helpers (Redis set) ────────────────────────────────────────────
const PRESENCE_KEY = "presence:online";

async function setOnline(userId: string): Promise<void> {
  try { await getRedis().sadd(PRESENCE_KEY, userId); } catch { /* skip */ }
}

async function setOffline(userId: string): Promise<void> {
  try { await getRedis().srem(PRESENCE_KEY, userId); } catch { /* skip */ }
}

// Debounce timers for typing indicators: key = `${userId}:${conversationId}`
const typingTimers = new Map<string, NodeJS.Timeout>();

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setupSocket(httpServer: HttpServer): Server {
  _io = new Server(httpServer, {
    cors: {
      origin:      env.clientUrl,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Redis adapter for horizontal scaling (only if Redis is available)
  if (isRedisAvailable()) {
    try {
      const pubClient = getRedis();
      const subClient = pubClient.duplicate();
      subClient.on("error", (err) => logger.error("Socket.IO sub-client Redis error", { err }));
      _io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.IO Redis adapter attached");
    } catch (err) {
      logger.warn("Socket.IO Redis adapter failed — using in-memory adapter", { err });
    }
  } else {
    logger.info("Socket.IO using in-memory adapter (Redis unavailable)");
  }

  // ── JWT auth middleware ────────────────────────────────────────────────────
  const tokenService = new TokenService();

  _io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("UNAUTHORIZED"));

      const payload = tokenService.verifyAccessToken(token as string);
      const user = await tokenService.getUserFromPayload(payload);
      if (!user) return next(new Error("UNAUTHORIZED"));

      (socket as any).userId = user._id.toString();
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  _io.on("connection", async (socket: Socket) => {
    const userId: string = (socket as any).userId;

    // Join personal room for DM delivery
    socket.join(`user:${userId}`);

    // Mark user as online and broadcast to their followers
    await setOnline(userId);
    socket.broadcast.emit("presence:online", { userId });

    logger.info(`Socket connected: ${userId} (${socket.id})`);

    // ── dm:send ──────────────────────────────────────────────────────────────
    // Alternative channel for sending messages (vs REST POST)
    socket.on(
      "dm:send",
      async (
        payload: { recipientId: string; text?: string; mediaUrl?: string; mediaType?: string },
        ack?: (resp: { ok: boolean; messageId?: string; error?: string }) => void
      ) => {
        try {
          const { recipientId, text, mediaUrl, mediaType } = payload;
          if (!recipientId) return ack?.({ ok: false, error: "recipientId required" });

          // Find or create conversation
          const [aOid, bOid] = [new Types.ObjectId(userId), new Types.ObjectId(recipientId)];
          let conv = await Conversation.findOne({
            participants: { $all: [aOid, bOid], $size: 2 },
          });
          if (!conv) conv = await Conversation.create({ participants: [aOid, bOid] });

          const message = await Message.create({
            conversationId: conv._id,
            senderId: userId,
            text:      text ?? "",
            mediaUrl:  mediaUrl ?? null,
            mediaType: mediaType ?? "",
          });

          await Conversation.findByIdAndUpdate(conv._id, {
            lastMessage: {
              text:      message.text,
              mediaType: message.mediaType,
              senderId:  message.senderId,
              createdAt: message.createdAt,
            },
          });

          const outgoing = {
            _id:            message._id,
            conversationId: conv._id,
            senderId:       userId,
            text:           message.text,
            mediaUrl:       message.mediaUrl,
            mediaType:      message.mediaType,
            createdAt:      message.createdAt,
          };

          // Deliver to recipient
          socket.to(`user:${recipientId}`).emit("dm:new", {
            conversationId: conv._id.toString(),
            message:        outgoing,
          });

          ack?.({ ok: true, messageId: message._id.toString() });
        } catch (err) {
          logger.error("dm:send error", { err });
          ack?.({ ok: false, error: "Failed to send message" });
        }
      }
    );

    // ── dm:typing ────────────────────────────────────────────────────────────
    socket.on(
      "dm:typing",
      (payload: { conversationId: string; recipientId: string }) => {
        const { conversationId, recipientId } = payload;
        if (!conversationId || !recipientId) return;

        const key = `${userId}:${conversationId}`;

        // Forward typing event to recipient
        socket.to(`user:${recipientId}`).emit("dm:typing", { conversationId, userId });

        // Auto-stop after 3 seconds
        if (typingTimers.has(key)) clearTimeout(typingTimers.get(key)!);
        typingTimers.set(
          key,
          setTimeout(() => {
            socket.to(`user:${recipientId}`).emit("dm:typing:stop", { conversationId, userId });
            typingTimers.delete(key);
          }, 3000)
        );
      }
    );

    // ── dm:typing:stop ───────────────────────────────────────────────────────
    socket.on(
      "dm:typing:stop",
      (payload: { conversationId: string; recipientId: string }) => {
        const { conversationId, recipientId } = payload;
        if (!conversationId || !recipientId) return;

        const key = `${userId}:${conversationId}`;
        if (typingTimers.has(key)) {
          clearTimeout(typingTimers.get(key)!);
          typingTimers.delete(key);
        }
        socket.to(`user:${recipientId}`).emit("dm:typing:stop", { conversationId, userId });
      }
    );

    // ── dm:read ──────────────────────────────────────────────────────────────
    socket.on("dm:read", async (payload: { conversationId: string }) => {
      try {
        const { conversationId } = payload;
        if (!conversationId) return;

        const userOid = new Types.ObjectId(userId);
        await Conversation.findOneAndUpdate(
          { _id: conversationId, participants: userOid },
          { $pull: { readBy: { userId: userOid } } }
        );
        await Conversation.findOneAndUpdate(
          { _id: conversationId, participants: userOid },
          { $push: { readBy: { userId: userOid, readAt: new Date() } } }
        );
      } catch (err) {
        logger.error("dm:read error", { err });
      }
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      await setOffline(userId);
      socket.broadcast.emit("presence:offline", { userId });
      logger.info(`Socket disconnected: ${userId} (${socket.id})`);
    });
  });

  logger.info("Socket.IO initialized");
  return _io;
}
