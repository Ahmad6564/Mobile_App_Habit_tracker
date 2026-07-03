import { Schema, model, Document, Types } from "mongoose";

export interface IJourneyComment extends Document {
  _id:       Types.ObjectId;
  journeyId: Types.ObjectId;
  userId:    Types.ObjectId;
  text:      string;
  createdAt: Date;
}

const journeyCommentSchema = new Schema<IJourneyComment>(
  {
    journeyId: { type: Schema.Types.ObjectId, ref: "Journey", required: true, index: true },
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    text:      { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

journeyCommentSchema.index({ journeyId: 1, createdAt: -1 });

export const JourneyComment = model<IJourneyComment>("JourneyComment", journeyCommentSchema);
