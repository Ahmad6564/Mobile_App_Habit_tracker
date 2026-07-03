import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id:            Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId:       Types.ObjectId;
  text:           string;
  mediaUrl:       string | null;
  mediaType:      "image" | "video" | "";
  createdAt:      Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId:       { type: Schema.Types.ObjectId, ref: "User", required: true },
    text:           { type: String, default: "" },
    mediaUrl:       { type: String, default: null },
    mediaType:      { type: String, enum: ["image", "video", ""], default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);
