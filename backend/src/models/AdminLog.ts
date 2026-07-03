import { Schema, model, Document, Types } from "mongoose";

export interface IAdminLog extends Document {
  _id:        Types.ObjectId;
  adminId:    Types.ObjectId;
  action:     string;
  targetType: string | null;
  targetId:   Types.ObjectId | null;
  details:    Record<string, unknown> | null;
  createdAt:  Date;
}

const adminLogSchema = new Schema<IAdminLog>(
  {
    adminId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    action:     { type: String, required: true },
    targetType: { type: String, default: null },
    targetId:   { type: Schema.Types.ObjectId, default: null },
    details:    { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ createdAt: -1 });

export const AdminLog = model<IAdminLog>("AdminLog", adminLogSchema);
