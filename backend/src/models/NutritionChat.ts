import { Schema, model, Document, Types } from "mongoose";

interface INutritionMessage {
  role:       "user" | "assistant";
  text:       string;
  imageUrl?:  string;
  nutrition?: {
    calories: number;
    protein:  number;
    carbs:    number;
    fat:      number;
    fiber:    number;
    items:    { name: string; calories: number; portion: string }[];
  } | null;
  createdAt:  Date;
}

export interface INutritionChat extends Document {
  _id:       Types.ObjectId;
  userId:    Types.ObjectId;
  title:     string;
  messages:  INutritionMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const nutritionMessageSchema = new Schema<INutritionMessage>(
  {
    role:      { type: String, enum: ["user", "assistant"], required: true },
    text:      { type: String, default: "" },
    imageUrl:  { type: String, default: undefined },
    nutrition: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const nutritionChatSchema = new Schema<INutritionChat>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title:    { type: String, default: "New nutrition chat" },
    messages: [nutritionMessageSchema],
  },
  { timestamps: true }
);

nutritionChatSchema.index({ userId: 1, updatedAt: -1 });

export const NutritionChat = model<INutritionChat>("NutritionChat", nutritionChatSchema);
