import { Schema, model, Document, Types } from "mongoose";

export interface IReferral extends Document {
  _id:           Types.ObjectId;
  referrerId:    Types.ObjectId;
  referredId:    Types.ObjectId;
  code:          string;
  rewardClaimed: boolean;
  createdAt:     Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrerId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    code:          { type: String, required: true },
    rewardClaimed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

referralSchema.index({ referredId: 1 }, { unique: true }); // user can only be referred once
referralSchema.index({ code: 1 });

export const Referral = model<IReferral>("Referral", referralSchema);
