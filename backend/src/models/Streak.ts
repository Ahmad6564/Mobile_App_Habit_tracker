import { Schema, model, Document, Types } from "mongoose";

export interface IStreak extends Document {
  _id: Types.ObjectId;
  habitId: Types.ObjectId;
  userId: Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  /** "YYYY-MM-DD" of the most-recent completed log, or null */
  lastLogDate: string | null;
  /** Date the streak shield was last used, or null */
  shieldUsedAt: Date | null;
  updatedAt: Date;
}

const streakSchema = new Schema<IStreak>(
  {
    habitId:       { type: Schema.Types.ObjectId, ref: "Habit", required: true, unique: true },
    userId:        { type: Schema.Types.ObjectId, ref: "User",  required: true, index: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLogDate:   { type: String, default: null },
    shieldUsedAt:  { type: Date,   default: null },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Streak = model<IStreak>("Streak", streakSchema);
