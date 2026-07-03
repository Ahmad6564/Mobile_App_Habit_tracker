import { Schema, model, Document, Types } from "mongoose";

export interface ILike extends Document {
  _id:       Types.ObjectId;
  userId:    Types.ObjectId;
  postId:    Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  { userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

likeSchema.index({ userId: 1, postId: 1 }, { unique: true });
likeSchema.index({ postId: 1 });

export const Like = model<ILike>("Like", likeSchema);
