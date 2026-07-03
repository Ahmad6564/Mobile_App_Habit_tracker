import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "like"
  | "comment"
  | "repost"
  | "follow"
  | "follow_request"
  | "message"
  | "reminder"
  | "system";

export interface INotification extends Document {
  _id:          Types.ObjectId;
  userId:       Types.ObjectId;
  type:         NotificationType;
  fromUserId?:  Types.ObjectId;
  postId?:      Types.ObjectId;
  text:         string;
  read:         boolean;
  data?:        Record<string, unknown>;
  createdAt:    Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["like", "comment", "repost", "follow", "follow_request", "message", "reminder", "system"],
      required: true,
    },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    postId:     { type: Schema.Types.ObjectId, ref: "Post",  default: null },
    text:       { type: String, required: true, maxlength: 500 },
    read:       { type: Boolean, default: false },
    data:       { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const Notification = model<INotification>("Notification", notificationSchema);
