import OpenAI from "openai";
import { CoachChat, ICoachChat } from "../models/CoachChat";
import { Habit } from "../models/Habit";
import { Streak } from "../models/Streak";
import { HabitLog } from "../models/HabitLog";
import { User } from "../models/User";
import { getRedis } from "../config/redis";
import { Errors } from "../utils/AppError";
import { env } from "../config/env";
import { fmtDate } from "../utils/dateUtils";

const DAILY_MESSAGE_LIMIT = 50;
const MAX_HISTORY_MESSAGES = 20; // send last 20 exchanges to OpenAI to keep cost down

function getOpenAI(): OpenAI {
  if (!env.openaiApiKey) {
    throw Errors.badRequest(
      "AI Coach is not configured. Set the OPENAI_API_KEY environment variable."
    );
  }
  return new OpenAI({ apiKey: env.openaiApiKey });
}

export class CoachService {
  // ─────────────────────────────────────────────────────────────────────────
  // Chat CRUD
  // ─────────────────────────────────────────────────────────────────────────

  async listChats(userId: string): Promise<ICoachChat[]> {
    return CoachChat.find({ userId })
      .sort({ updatedAt: -1 })
      .select("title createdAt updatedAt")
      .lean() as unknown as ICoachChat[];
  }

  async createChat(userId: string): Promise<ICoachChat> {
    return CoachChat.create({ userId, title: "New chat", messages: [] });
  }

  async getChat(userId: string, chatId: string): Promise<ICoachChat> {
    const chat = await CoachChat.findOne({ _id: chatId, userId }).lean();
    if (!chat) throw Errors.notFound("Chat");
    return chat as unknown as ICoachChat;
  }

  async deleteChat(userId: string, chatId: string): Promise<void> {
    const result = await CoachChat.findOneAndDelete({ _id: chatId, userId });
    if (!result) throw Errors.notFound("Chat");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Send message
  // ─────────────────────────────────────────────────────────────────────────

  async sendMessage(
    userId: string,
    chatId: string,
    userText: string
  ): Promise<{ reply: string; chat: ICoachChat }> {
    // Rate limit: 50 messages per day per user
    await this.checkRateLimit(userId);

    const chat = await CoachChat.findOne({ _id: chatId, userId });
    if (!chat) throw Errors.notFound("Chat");

    // Build the system prompt with user context
    const systemPrompt = await this.buildSystemPrompt(userId);

    // Build message history for OpenAI (trim to last N messages)
    const historySlice = chat.messages.slice(-MAX_HISTORY_MESSAGES);
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...historySlice.map((m) => ({
        role: m.role === "coach" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      })),
      { role: "user", content: userText },
    ];

    // Call OpenAI
    const openai = getOpenAI();
    let reply: string;
    try {
      const completion = await openai.chat.completions.create({
        model:       "gpt-4o",
        messages:    openAIMessages,
        max_tokens:  800,
        temperature: 0.7,
      });
      reply = completion.choices[0]?.message?.content?.trim() ?? "I'm unable to respond right now.";
    } catch (err: any) {
      // Surface API errors as service errors
      throw Errors.badRequest(`AI service error: ${err?.message ?? "unknown error"}`);
    }

    // Auto-title on first message
    if (chat.messages.length === 0) {
      chat.title = userText.slice(0, 60) + (userText.length > 60 ? "…" : "");
    }

    // Persist messages
    const now = new Date();
    chat.messages.push({ role: "user",  text: userText, createdAt: now });
    chat.messages.push({ role: "coach", text: reply,    createdAt: now });
    await chat.save();

    return { reply, chat };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Context builders
  // ─────────────────────────────────────────────────────────────────────────

  private async buildSystemPrompt(userId: string): Promise<string> {
    const today = fmtDate(new Date());
    const weekAgo = fmtDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const [user, habits, streaks, recentLogs] = await Promise.all([
      User.findById(userId).select("firstName lastName bio").lean(),
      Habit.find({ userId, archived: false }).lean(),
      Streak.find({ userId }).lean(),
      HabitLog.find({ userId, date: { $gte: weekAgo, $lte: today } }).lean(),
    ]);

    const streakMap: Record<string, number> = {};
    for (const s of streaks) streakMap[s.habitId.toString()] = s.currentStreak;

    // Per-habit 7-day completion rate
    const habitLines = habits.map((h) => {
      const hId = h._id.toString();
      const hLogs = recentLogs.filter(
        (l) => l.habitId.toString() === hId && l.completed
      );
      const streak = streakMap[hId] ?? 0;
      return `  • ${h.name} (${h.category}) — goal: ${h.goal} ${h.unit}/day, streak: ${streak}d, completed ${hLogs.length}/7 days this week`;
    });

    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "there";
    const bio = user?.bio ? `\nUser's goals/bio: "${user.bio}"` : "";

    return `You are HabitForge Coach, an encouraging and practical AI habit coach.
You are talking to ${name}.${bio}

Current habits and weekly progress:
${habitLines.length ? habitLines.join("\n") : "  No habits yet."}

Guidelines:
- Be supportive, specific, and actionable.
- Reference the user's actual habits and streaks when relevant.
- Keep responses concise (2–4 paragraphs max).
- Never invent habit data — only use what is provided above.`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rate limiting (Redis)
  // ─────────────────────────────────────────────────────────────────────────

  private async checkRateLimit(userId: string): Promise<void> {
    const today = fmtDate(new Date());
    const key = `coach:rate:${userId}:${today}`;

    const count = await getRedis().incr(key);
    if (count === 1) await getRedis().expire(key, 86400); // reset next calendar day
    if (count > DAILY_MESSAGE_LIMIT) {
      throw Errors.tooManyRequests();
    }
  }
}
