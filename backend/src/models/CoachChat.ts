import { Schema, model, Document, Types } from "mongoose";

interface IChatMessage {
  role:      "user" | "coach";
  text:      string;
  createdAt: Date;
}

export interface ICoachChat extends Document {
  _id:       Types.ObjectId;
  userId:    Types.ObjectId;
  title:     string;
  messages:  IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const coachChatSchema = new Schema<ICoachChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title:  { type: String, default: "New chat", maxlength: 120 },
    messages: [
      {
        role:      { type: String, enum: ["user", "coach"], required: true },
        text:      { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

coachChatSchema.index({ userId: 1, updatedAt: -1 });

export const CoachChat = model<ICoachChat>("CoachChat", coachChatSchema);
