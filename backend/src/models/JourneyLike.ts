import { Schema, model, Document, Types } from "mongoose";

export interface IJourneyLike extends Document {
  _id:       Types.ObjectId;
  userId:    Types.ObjectId;
  journeyId: Types.ObjectId;
  createdAt: Date;
}

const journeyLikeSchema = new Schema<IJourneyLike>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    journeyId: { type: Schema.Types.ObjectId, ref: "Journey", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

journeyLikeSchema.index({ userId: 1, journeyId: 1 }, { unique: true });
journeyLikeSchema.index({ journeyId: 1 });

export const JourneyLike = model<IJourneyLike>("JourneyLike", journeyLikeSchema);
