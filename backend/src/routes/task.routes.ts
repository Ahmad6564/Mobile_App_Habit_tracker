import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { sendSuccess } from "../utils/response";
import { TaskService } from "../services/task.service";
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
} from "../validators/task.validators";

const router = Router();
const service = new TaskService();

// All task routes require authentication
router.use(authenticate);

// ── Summary (before /:id) ─────────────────────────────────────────────────────

/**
 * GET /api/tasks/summary
 * Counts by status: all, open, done, today, overdue.
 */
router.get(
  "/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await service.getSummary((req as any).user.id);
    sendSuccess(res, data);
  })
);

// ── Collection ────────────────────────────────────────────────────────────────

/**
 * GET /api/tasks?status=&due=&page=&limit=
 * List tasks with optional filters.
 */
router.get(
  "/",
  validate(listTasksSchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as {
      status?: string;
      due?: string;
      page: number;
      limit: number;
    };
    const result = await service.listTasks((req as any).user.id, q);
    sendSuccess(res, result.tasks, 200, undefined, {
      total:      result.total,
      page:       result.page,
      limit:      q.limit,
      totalPages: result.pages,
    });
  })
);

/**
 * POST /api/tasks
 * Create a new task.
 */
router.post(
  "/",
  validate(createTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await service.createTask((req as any).user.id, req.body);
    sendSuccess(res, task, 201);
  })
);

// ── Single-resource routes ────────────────────────────────────────────────────

/**
 * PATCH /api/tasks/:id
 * Update task fields.
 */
router.patch(
  "/:id",
  validate(updateTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await service.updateTask((req as any).user.id, req.params.id, req.body);
    sendSuccess(res, task);
  })
);

/**
 * PATCH /api/tasks/:id/toggle
 * Toggle done ↔ not-done, updating doneAt automatically.
 */
router.patch(
  "/:id/toggle",
  asyncHandler(async (req: Request, res: Response) => {
    const task = await service.toggleTask((req as any).user.id, req.params.id);
    sendSuccess(res, task);
  })
);

/**
 * DELETE /api/tasks/:id
 * Permanently delete a task.
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    await service.deleteTask((req as any).user.id, req.params.id);
    sendSuccess(res, null, 200, "Task deleted");
  })
);

export default router;
