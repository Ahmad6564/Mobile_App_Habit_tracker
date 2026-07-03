import { Schema, model, Document, Types } from "mongoose";

export type ReportTargetType = "post" | "comment" | "user" | "journey";
export type ReportReason = "spam" | "harassment" | "misinformation" | "inappropriate" | "other";
export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export interface IReport extends Document {
  _id:         Types.ObjectId;
  reporterId:  Types.ObjectId;
  targetType:  ReportTargetType;
  targetId:    Types.ObjectId;
  reason:      ReportReason;
  description: string;
  status:      ReportStatus;
  reviewedBy:  Types.ObjectId | null;
  action:      string | null;
  createdAt:   Date;
  reviewedAt:  Date | null;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType:  { type: String, enum: ["post", "comment", "user", "journey"], required: true },
    targetId:    { type: Schema.Types.ObjectId, required: true },
    reason:      { type: String, enum: ["spam", "harassment", "misinformation", "inappropriate", "other"], required: true },
    description: { type: String, default: "", maxlength: 1000 },
    status:      { type: String, enum: ["pending", "reviewed", "actioned", "dismissed"], default: "pending" },
    reviewedBy:  { type: Schema.Types.ObjectId, ref: "User", default: null },
    action:      { type: String, default: null },
    reviewedAt:  { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetId: 1, targetType: 1 });

export const Report = model<IReport>("Report", reportSchema);
