import { Schema, model, Document, Types } from "mongoose";

export interface ITask extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  notes: string;
  /** "YYYY-MM-DD" or null */
  due: string | null;
  priority: "low" | "medium" | "high";
  done: boolean;
  doneAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title:    { type: String, required: true, trim: true, maxlength: 300 },
    notes:    { type: String, default: "", maxlength: 2000 },
    due:      { type: String, default: null, match: [/^\d{4}-\d{2}-\d{2}$/, "due must be YYYY-MM-DD"] },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    done:     { type: Boolean, default: false },
    doneAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, done: 1, due: 1 });

export const Task = model<ITask>("Task", taskSchema);
