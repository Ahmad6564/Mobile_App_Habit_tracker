import { Schema, model, Document, Types } from "mongoose";

export interface IHabitLog extends Document {
  _id: Types.ObjectId;
  habitId: Types.ObjectId;
  userId: Types.ObjectId;
  /** "YYYY-MM-DD" */
  date: string;
  value: number;
  completed: boolean;
  note: string;
  mood: string;
  createdAt: Date;
  updatedAt: Date;
}

const habitLogSchema = new Schema<IHabitLog>(
  {
    habitId:   { type: Schema.Types.ObjectId, ref: "Habit", required: true },
    userId:    { type: Schema.Types.ObjectId, ref: "User",  required: true },
    date:      { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    value:     { type: Number, required: true, min: 0 },
    completed: { type: Boolean, default: false },
    note:      { type: String, default: "", maxlength: 500 },
    mood: {
      type: String,
      enum: ["great", "good", "okay", "bad", "terrible", ""],
      default: "",
    },
  },
  { timestamps: true }
);

/** One log per habit per day */
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: 1 });

export const HabitLog = model<IHabitLog>("HabitLog", habitLogSchema);
