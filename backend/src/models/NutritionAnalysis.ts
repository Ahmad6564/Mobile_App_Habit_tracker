import { Schema, model, Document, Types } from "mongoose";

interface INutritionItem {
  name:     string;
  calories: number;
  portion:  string;
}

interface INutritionResult {
  meal:        string;
  confidence:  number;
  calories:    number;
  protein:     number;
  carbs:       number;
  fat:         number;
  fiber:       number;
  items:       INutritionItem[];
  suggestions: string[];
}

export interface INutritionAnalysis extends Document {
  _id:             Types.ObjectId;
  userId:          Types.ObjectId;
  chatId?:         Types.ObjectId;
  imageUrl:        string;
  mealType:        "breakfast" | "lunch" | "dinner" | "snack";
  date:            string; // "YYYY-MM-DD"
  result:          INutritionResult;
  corrected:       boolean;
  correctedResult: INutritionResult | null;
  createdAt:       Date;
}

const nutritionAnalysisSchema = new Schema<INutritionAnalysis>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chatId:   { type: Schema.Types.ObjectId, ref: "NutritionChat", default: null },
    imageUrl: { type: String, required: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], default: "snack" },
    date:     { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    result: {
      meal:        { type: String, default: "" },
      confidence:  { type: Number, default: 0 },
      calories:    { type: Number, default: 0 },
      protein:     { type: Number, default: 0 },
      carbs:       { type: Number, default: 0 },
      fat:         { type: Number, default: 0 },
      fiber:       { type: Number, default: 0 },
      items:       [{ name: String, calories: Number, portion: String }],
      suggestions: [{ type: String }],
    },
    corrected:       { type: Boolean, default: false },
    correctedResult: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

nutritionAnalysisSchema.index({ userId: 1, date: 1 });
nutritionAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const NutritionAnalysis = model<INutritionAnalysis>("NutritionAnalysis", nutritionAnalysisSchema);
