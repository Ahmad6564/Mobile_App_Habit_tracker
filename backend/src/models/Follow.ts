import { Schema, model, Document, Types } from "mongoose";

export interface IFollow extends Document {
  _id: Types.ObjectId;
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  /** accepted = mutual visibility; pending = waiting approval (private accounts) */
  status: "accepted" | "pending";
  createdAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    followerId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    followingId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status:      { type: String, enum: ["accepted", "pending"], default: "accepted" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1, status: 1 });
followSchema.index({ followerId: 1, status: 1 });

export const Follow = model<IFollow>("Follow", followSchema);
