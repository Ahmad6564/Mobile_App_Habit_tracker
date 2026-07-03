import { Schema, model, Document, Types } from "mongoose";

export type BadgeType =
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "streak_365"
  | "referral_1"
  | "referral_5"
  | "referral_10"
  | "first_post"
  | "first_journey"
  | "community_contributor"
  | "mentor";

export interface IBadge extends Document {
  _id:        Types.ObjectId;
  userId:     Types.ObjectId;
  type:       BadgeType;
  name:       string;
  icon:       string;
  unlockedAt: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    type:       { type: String, required: true },
    name:       { type: String, required: true },
    icon:       { type: String, default: "" },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

badgeSchema.index({ userId: 1, type: 1 }, { unique: true });
badgeSchema.index({ userId: 1 });

export const Badge = model<IBadge>("Badge", badgeSchema);
