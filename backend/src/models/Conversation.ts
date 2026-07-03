import { Schema, model, Document, Types } from "mongoose";

interface ILastMessage {
  text:      string;
  mediaType: string;
  senderId:  Types.ObjectId;
  createdAt: Date;
}

interface IReadBy {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IConversation extends Document {
  _id:          Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage:  ILastMessage | null;
  readBy:       IReadBy[];
  createdAt:    Date;
  updatedAt:    Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: {
      type: new Schema({
        text:      { type: String, default: "" },
        mediaType: { type: String, default: "" },
        senderId:  { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date },
      }),
      default: null,
    },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export const Conversation = model<IConversation>("Conversation", conversationSchema);
