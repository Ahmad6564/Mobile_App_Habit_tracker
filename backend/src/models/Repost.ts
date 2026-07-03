import { Schema, model, Document, Types } from "mongoose";

export interface IRepost extends Document {
  _id:       Types.ObjectId;
  userId:    Types.ObjectId;
  postId:    Types.ObjectId;
  createdAt: Date;
}

const repostSchema = new Schema<IRepost>(
  { userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

repostSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Repost = model<IRepost>("Repost", repostSchema);
