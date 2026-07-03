import { Schema, model, Document, Types } from "mongoose";

export interface ISave extends Document {
  _id:       Types.ObjectId;
  userId:    Types.ObjectId;
  postId:    Types.ObjectId;
  createdAt: Date;
}

const saveSchema = new Schema<ISave>(
  { userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

saveSchema.index({ userId: 1, postId: 1 }, { unique: true });
saveSchema.index({ userId: 1, createdAt: -1 });

export const Save = model<ISave>("Save", saveSchema);
