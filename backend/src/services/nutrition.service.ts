import OpenAI from "openai";
import { NutritionAnalysis, INutritionAnalysis } from "../models/NutritionAnalysis";
import { NutritionChat, INutritionChat } from "../models/NutritionChat";
import { getRedis } from "../config/redis";
import { Errors } from "../utils/AppError";
import { env } from "../config/env";
import { today } from "../utils/dateUtils";

const DAILY_ANALYSIS_LIMIT = 10;

function getOpenAI(): OpenAI {
  if (!env.openaiApiKey) {
    throw Errors.badRequest(
      "Nutrition AI is not configured. Set the OPENAI_API_KEY environment variable."
    );
  }
  return new OpenAI({ apiKey: env.openaiApiKey });
}

const SYSTEM_PROMPT = `You are a nutrition analysis AI assistant. When given an image of food, identify the meal and provide detailed nutritional information.
Respond ONLY with valid JSON in the following format:
{
  "meal": "Short meal description",
  "confidence": 0.0-1.0,
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams),
  "items": [{"name":"item name","calories":number,"portion":"e.g. 1 cup"}],
  "suggestions": ["suggestion 1","suggestion 2"]
}
Be as accurate as possible. If you cannot identify the food, set confidence to 0.`;

const CHAT_SYSTEM_PROMPT = `You are a knowledgeable nutrition assistant. Help users understand their diet, answer nutrition questions, and provide meal suggestions. Be concise but informative. If the user shares a food image, analyze it and provide nutritional information.`;

export class NutritionService {
  // ─────────────────────────────────────────────────────────────────────────
  // Image analysis
  // ─────────────────────────────────────────────────────────────────────────

  async analyze(
    userId: string,
    imageUrl: string,
    mealType: "breakfast" | "lunch" | "dinner" | "snack",
    date?: string
  ): Promise<INutritionAnalysis> {
    // Rate limit: 10 analyses per day
    const redis = getRedis();
    const key = `nutrition:rate:${userId}:${today()}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 86400);
    if (count > DAILY_ANALYSIS_LIMIT) {
      throw Errors.tooManyRequests();
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: "Analyze this meal and provide nutritional information." },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let result;
    try {
      result = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
    } catch {
      result = {
        meal: "Unknown",
        confidence: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        items: [],
        suggestions: [],
      };
    }

    const analysis = await NutritionAnalysis.create({
      userId,
      imageUrl,
      mealType,
      date: date ?? today(),
      result,
    });

    return analysis;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Daily log
  // ─────────────────────────────────────────────────────────────────────────

  async getDailyLog(userId: string, date: string): Promise<INutritionAnalysis[]> {
    return NutritionAnalysis.find({ userId, date })
      .sort({ createdAt: 1 })
      .lean() as unknown as INutritionAnalysis[];
  }

  async getDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<INutritionAnalysis[]> {
    return NutritionAnalysis.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1, createdAt: 1 })
      .lean() as unknown as INutritionAnalysis[];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Weekly report
  // ─────────────────────────────────────────────────────────────────────────

  async getWeeklyReport(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalCalories: number;
    avgCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    mealCount: number;
    dailyBreakdown: { date: string; calories: number; meals: number }[];
  }> {
    const logs = await this.getDateRange(userId, startDate, endDate);

    const dailyMap = new Map<string, { calories: number; meals: number }>();
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    for (const log of logs) {
      const r = log.corrected && log.correctedResult ? log.correctedResult : log.result;
      totalCalories += r.calories;
      totalProtein += r.protein;
      totalCarbs += r.carbs;
      totalFat += r.fat;
      totalFiber += r.fiber;

      const existing = dailyMap.get(log.date) ?? { calories: 0, meals: 0 };
      existing.calories += r.calories;
      existing.meals += 1;
      dailyMap.set(log.date, existing);
    }

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    const days = dailyBreakdown.length || 1;

    return {
      totalCalories,
      avgCalories: Math.round(totalCalories / days),
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      mealCount: logs.length,
      dailyBreakdown,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Correct analysis
  // ─────────────────────────────────────────────────────────────────────────

  async correct(
    userId: string,
    analysisId: string,
    correctedResult: Record<string, unknown>
  ): Promise<INutritionAnalysis> {
    const analysis = await NutritionAnalysis.findOneAndUpdate(
      { _id: analysisId, userId },
      { corrected: true, correctedResult },
      { new: true }
    ).lean();
    if (!analysis) throw Errors.notFound("Analysis");
    return analysis as unknown as INutritionAnalysis;
  }

  async deleteAnalysis(userId: string, analysisId: string): Promise<void> {
    const result = await NutritionAnalysis.findOneAndDelete({ _id: analysisId, userId });
    if (!result) throw Errors.notFound("Analysis");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Chat CRUD
  // ─────────────────────────────────────────────────────────────────────────

  async listChats(userId: string): Promise<INutritionChat[]> {
    return NutritionChat.find({ userId })
      .sort({ updatedAt: -1 })
      .select("title createdAt updatedAt")
      .lean() as unknown as INutritionChat[];
  }

  async createChat(userId: string): Promise<INutritionChat> {
    return NutritionChat.create({ userId, title: "New nutrition chat", messages: [] });
  }

  async getChat(userId: string, chatId: string): Promise<INutritionChat> {
    const chat = await NutritionChat.findOne({ _id: chatId, userId }).lean();
    if (!chat) throw Errors.notFound("Chat");
    return chat as unknown as INutritionChat;
  }

  async deleteChat(userId: string, chatId: string): Promise<void> {
    const result = await NutritionChat.findOneAndDelete({ _id: chatId, userId });
    if (!result) throw Errors.notFound("Chat");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Chat message
  // ─────────────────────────────────────────────────────────────────────────

  async sendMessage(
    userId: string,
    chatId: string,
    text: string,
    imageUrl?: string
  ): Promise<{ reply: string; chat: INutritionChat }> {
    const chat = await NutritionChat.findOne({ _id: chatId, userId });
    if (!chat) throw Errors.notFound("Chat");

    // Rate limit: same daily limit
    const redis = getRedis();
    const key = `nutrition:chat:rate:${userId}:${today()}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 86400);
    if (count > 50) throw Errors.tooManyRequests();

    // Add user message
    chat.messages.push({
      role: "user",
      text,
      imageUrl: imageUrl || undefined,
      nutrition: null,
      createdAt: new Date(),
    });

    // Build OpenAI messages
    const openai = getOpenAI();
    const lastMessages = chat.messages.slice(-20);

    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
    ];

    for (const msg of lastMessages) {
      if (msg.role === "user") {
        if (msg.imageUrl) {
          openaiMessages.push({
            role: "user",
            content: [
              { type: "image_url", image_url: { url: msg.imageUrl } },
              { type: "text", text: msg.text || "Analyze this food." },
            ],
          });
        } else {
          openaiMessages.push({ role: "user", content: msg.text });
        }
      } else {
        openaiMessages.push({ role: "assistant", content: msg.text });
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openaiMessages,
      max_tokens: 600,
      temperature: 0.5,
    });

    const reply = response.choices[0]?.message?.content ?? "I couldn't process that. Please try again.";

    chat.messages.push({
      role: "assistant",
      text: reply,
      nutrition: null,
      createdAt: new Date(),
    });

    // Auto-title on first exchange
    if (chat.messages.length <= 2 && chat.title === "New nutrition chat") {
      chat.title = text.slice(0, 50) || "Nutrition chat";
    }

    await chat.save();
    return { reply, chat: chat.toObject() as unknown as INutritionChat };
  }
}

export const nutritionService = new NutritionService();
