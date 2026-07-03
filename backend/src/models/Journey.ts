import { Schema, model, Document, Types } from "mongoose";

export interface IJourney extends Document {
  _id:           Types.ObjectId;
  userId:        Types.ObjectId;
  challenge:     string;
  helped:        string;
  overcame:      string;
  habitTags:     string[];
  visibility:    "public" | "community" | "private";
  likesCount:    number;
  commentsCount: number;
  createdAt:     Date;
  updatedAt:     Date;
}

const journeySchema = new Schema<IJourney>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    challenge:     { type: String, required: true, maxlength: 5000 },
    helped:        { type: String, required: true, maxlength: 5000 },
    overcame:      { type: String, required: true, maxlength: 5000 },
    habitTags:     [{ type: String, trim: true }],
    visibility:    { type: String, enum: ["public", "community", "private"], default: "public" },
    likesCount:    { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

journeySchema.index({ visibility: 1, createdAt: -1 });
journeySchema.index({ userId: 1, createdAt: -1 });

export const Journey = model<IJourney>("Journey", journeySchema);
