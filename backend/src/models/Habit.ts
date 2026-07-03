import { Schema, model, Document, Types } from "mongoose";

export interface IHabit extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  icon: string;
  goal: number;
  unit: string;
  category: string;
  color: string;
  schedule: string[];
  archived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabit>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name:       { type: String, required: true, trim: true, maxlength: 100 },
    icon:       { type: String, default: "spark", maxlength: 50 },
    goal:       { type: Number, required: true, min: 1 },
    unit:       { type: String, default: "times", maxlength: 50 },
    category:   { type: String, default: "General", maxlength: 50 },
    color:      { type: String, default: "#22d3ee", maxlength: 30 },
    schedule:   {
      type: [String],
      default: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      validate: {
        validator: (arr: string[]) =>
          arr.length > 0 &&
          arr.every((d) => ["mon","tue","wed","thu","fri","sat","sun"].includes(d)),
        message: "Schedule must contain at least one valid day",
      },
    },
    archived:   { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Habit = model<IHabit>("Habit", habitSchema);
