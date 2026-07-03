import { Task, ITask } from "../models/Task";
import { Types } from "mongoose";
import { Errors } from "../utils/AppError";
import { today } from "../utils/dateUtils";

export class TaskService {
  async createTask(
    userId: string,
    data: {
      title: string;
      notes?: string;
      due?: string | null;
      priority?: "low" | "medium" | "high";
    }
  ): Promise<ITask> {
    return Task.create({ userId, ...data });
  }

  async updateTask(
    userId: string,
    taskId: string,
    data: Partial<Pick<ITask, "title" | "notes" | "due" | "priority" | "done">>
  ): Promise<ITask> {
    // If caller is marking done via update (not toggle), set doneAt accordingly
    const extra: Partial<ITask> = {};
    if (typeof data.done === "boolean") {
      extra.doneAt = data.done ? new Date() : null;
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      { $set: { ...data, ...extra } },
      { new: true, runValidators: true }
    );
    if (!task) throw Errors.notFound("Task");
    return task;
  }

  async toggleTask(userId: string, taskId: string): Promise<ITask> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw Errors.notFound("Task");

    task.done   = !task.done;
    task.doneAt = task.done ? new Date() : null;
    await task.save();
    return task;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const result = await Task.findOneAndDelete({ _id: taskId, userId });
    if (!result) throw Errors.notFound("Task");
  }

  async listTasks(
    userId: string,
    filters: {
      status?: string;
      due?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ tasks: ITask[]; total: number; page: number; pages: number }> {
    const { status = "all", due, page = 1, limit = 50 } = filters;
    const todayStr = today();

    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

    if (due) query["due"] = due;

    switch (status) {
      case "open":
        query["done"] = false;
        break;
      case "done":
        query["done"] = true;
        break;
      case "today":
        query["due"]  = todayStr;
        query["done"] = false;
        break;
      case "overdue":
        query["due"]  = { $lt: todayStr, $ne: null };
        query["done"] = false;
        break;
      // "all" → no extra filter
    }

    // Priority order: high=3, medium=2, low=1
    const [tasks, total] = await Promise.all([
      Task.aggregate([
        { $match: query },
        {
          $addFields: {
            _priorityOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "high"] },   then: 3 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "low"] },    then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { done: 1, _priorityOrder: -1, due: 1, createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { _priorityOrder: 0 } },
      ]),
      Task.countDocuments(query),
    ]);

    return {
      tasks: tasks as ITask[],
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getSummary(userId: string): Promise<{
    all: number;
    open: number;
    done: number;
    today: number;
    overdue: number;
  }> {
    const todayStr = today();

    const [all, open, done, todayCount, overdue] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, done: false }),
      Task.countDocuments({ userId, done: true }),
      Task.countDocuments({ userId, due: todayStr, done: false }),
      Task.countDocuments({ userId, due: { $lt: todayStr, $ne: null }, done: false }),
    ]);

    return { all, open, done, today: todayCount, overdue };
  }
}
