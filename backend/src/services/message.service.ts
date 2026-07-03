import { Types } from "mongoose";
import { Conversation, IConversation } from "../models/Conversation";
import { Message, IMessage } from "../models/Message";
import { User } from "../models/User";
import { Block } from "../models/Block";
import { Errors } from "../utils/AppError";
import { getIO } from "./socket.service";
import { NotificationService } from "./notification.service";

const notifService = new NotificationService();

const PAGE_LIMIT = 30;

export class MessageService {
  // ─────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Find OR create the 1:1 conversation between two users */
  private async findOrCreateConversation(
    userAId: string,
    userBId: string
  ): Promise<IConversation> {
    const aOid = new Types.ObjectId(userAId);
    const bOid = new Types.ObjectId(userBId);

    let conv = await Conversation.findOne({
      participants: { $all: [aOid, bOid], $size: 2 },
    });

    if (!conv) {
      conv = await Conversation.create({ participants: [aOid, bOid] });
    }

    return conv;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Send a message
  // ─────────────────────────────────────────────────────────────────────────

  async sendMessage(
    senderId: string,
    recipientUsername: string,
    data: { text?: string; mediaUrl?: string; mediaType?: "image" | "video" | "" }
  ): Promise<{ message: IMessage; conversationId: string }> {
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) throw Errors.notFound("User");

    const recipientId = recipient._id.toString();
    if (recipientId === senderId) throw Errors.badRequest("Cannot message yourself");

    // Block check
    const blocked = await Block.countDocuments({
      $or: [
        { blockerId: senderId, blockedId: recipientId },
        { blockerId: recipientId, blockedId: senderId },
      ],
    });
    if (blocked) throw Errors.forbidden();

    if (!data.text?.trim() && !data.mediaUrl) {
      throw Errors.badRequest("Message must contain text or media");
    }

    const conversation = await this.findOrCreateConversation(senderId, recipientId);
    const conversationId = conversation._id.toString();

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      text:      data.text ?? "",
      mediaUrl:  data.mediaUrl ?? null,
      mediaType: data.mediaType ?? "",
    });

    // Update conversation's lastMessage
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text:      message.text,
        mediaType: message.mediaType,
        senderId:  message.senderId,
        createdAt: message.createdAt,
      },
      // Mark sender as having read the conversation
      $pull:       { readBy: { userId: new Types.ObjectId(senderId) } },
      $addToSet:   {},    // no-op placeholder
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      $push: {
        readBy: { userId: new Types.ObjectId(senderId), readAt: new Date() },
      },
    });

    // Emit to recipient via Socket.IO if they are online
    try {
      const io = getIO();
      io.to(`user:${recipientId}`).emit("dm:new", {
        conversationId,
        message: {
          _id:            message._id,
          senderId:       message.senderId,
          text:           message.text,
          mediaUrl:       message.mediaUrl,
          mediaType:      message.mediaType,
          createdAt:      message.createdAt,
          conversationId: message.conversationId,
        },
      });
    } catch {
      // Socket not initialized (test / dev without socket) — silently skip
    }

    // In-app notification for recipient
    const sender = await User.findById(senderId).select("username").lean();
    notifService.createSilent({
      userId:     recipientId,
      type:       "message",
      fromUserId: senderId,
      text:       `${sender?.username ?? "Someone"} sent you a message`,
    });

    return { message, conversationId };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // List conversations (inbox)
  // ─────────────────────────────────────────────────────────────────────────

  async getConversations(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ conversations: Record<string, unknown>[]; total: number }> {
    const userOid = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find({ participants: userOid })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({ participants: userOid }),
    ]);

    // Fetch the other participant's profile for each conversation
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherId = (conv.participants as Types.ObjectId[]).find(
          (p) => p.toString() !== userId
        );
        const other = otherId
          ? await User.findById(otherId).select("username firstName lastName avatarUrl").lean()
          : null;

        // Is conversation unread by the current user?
        const readEntry = (conv.readBy as any[]).find(
          (r: any) => r.userId?.toString() === userId
        );
        const isUnread =
          conv.lastMessage &&
          (!readEntry ||
            readEntry.readAt < (conv as any).lastMessage?.createdAt);

        return { ...conv, otherUser: other, isUnread };
      })
    );

    return { conversations: enriched as Record<string, unknown>[], total };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Message history (cursor-based: load older messages)
  // ─────────────────────────────────────────────────────────────────────────

  async getMessages(
    userId: string,
    conversationId: string,
    /** Fetch messages older than this message _id */
    before?: string,
    limit = PAGE_LIMIT
  ): Promise<{ messages: IMessage[]; hasMore: boolean }> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: new Types.ObjectId(userId),
    });
    if (!conversation) throw Errors.notFound("Conversation");

    const filter: Record<string, unknown> = { conversationId };
    if (before) filter["_id"] = { $lt: new Types.ObjectId(before) };

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return {
      messages: messages.reverse() as unknown as IMessage[],
      hasMore,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mark conversation as read
  // ─────────────────────────────────────────────────────────────────────────

  async markAsRead(userId: string, conversationId: string): Promise<void> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: new Types.ObjectId(userId),
    });
    if (!conversation) throw Errors.notFound("Conversation");

    const userOid = new Types.ObjectId(userId);
    await Conversation.findByIdAndUpdate(conversationId, {
      $pull:     { readBy: { userId: userOid } },
    });
    await Conversation.findByIdAndUpdate(conversationId, {
      $push: { readBy: { userId: userOid, readAt: new Date() } },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Unread conversation count
  // ─────────────────────────────────────────────────────────────────────────

  async getUnreadCount(userId: string): Promise<number> {
    const userOid = new Types.ObjectId(userId);

    const conversations = await Conversation.find({
      participants: userOid,
      lastMessage:  { $ne: null },
    }).lean();

    let unread = 0;
    for (const conv of conversations) {
      const readEntry = (conv.readBy as any[]).find(
        (r: any) => r.userId?.toString() === userId
      );
      const isUnread =
        !readEntry ||
        readEntry.readAt < (conv as any).lastMessage?.createdAt;
      if (isUnread) unread++;
    }

    return unread;
  }
}
