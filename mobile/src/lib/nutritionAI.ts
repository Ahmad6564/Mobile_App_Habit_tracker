import * as FileSystem from "expo-file-system/legacy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type FoodItem = {
  name: string;
  calories: number;
  portion: string;
};

export type NutritionResult = {
  meal: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  items: FoodItem[];
  suggestions: string[];
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

const SYSTEM_PROMPT = `You are a nutrition analysis AI. Given a food image, identify the meal and provide a detailed nutritional breakdown.

Respond ONLY with valid JSON matching this exact schema:
{
  "meal": "short meal description",
  "confidence": 0.0 to 1.0,
  "calories": number (kcal),
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams),
  "items": [{ "name": "item name", "calories": number, "portion": "e.g. 1 cup, 150g" }],
  "suggestions": ["tip 1", "tip 2", "tip 3"]
}

Rules:
- Be realistic with estimates based on visible portion sizes.
- confidence reflects how clearly you can identify the food (0.5 = uncertain, 0.9 = very clear).
- Provide 2-4 items detected in the image.
- Provide exactly 3 brief, actionable nutrition suggestions.
- Total calories should roughly equal the sum of item calories.
- Do NOT include markdown, code fences, or any text outside the JSON object.`;

// ---------------------------------------------------------------------------
// API Call
// ---------------------------------------------------------------------------
export async function analyzeFood(
  imageUri: string,
  mealType: string
): Promise<NutritionResult> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured. Set EXPO_PUBLIC_OPENAI_API_KEY in your .env file."
    );
  }

  // Convert local image to base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const dataUrl = `data:image/jpeg;base64,${base64}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${mealType} meal and provide the nutritional breakdown.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "low" },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 429) {
      throw new Error("Rate limit reached. Please wait a moment and try again.");
    }
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your EXPO_PUBLIC_OPENAI_API_KEY.");
    }
    throw new Error(`API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No response received from AI. Please try again.");
  }

  // Parse JSON response (handle possible markdown code fences)
  const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const result: NutritionResult = JSON.parse(cleaned);

  // Validate required fields
  if (
    typeof result.calories !== "number" ||
    typeof result.protein !== "number" ||
    typeof result.carbs !== "number" ||
    typeof result.fat !== "number"
  ) {
    throw new Error("Invalid response format from AI. Please try again.");
  }

  return result;
}
