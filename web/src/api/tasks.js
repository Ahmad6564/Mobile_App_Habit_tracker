/**
 * Tasks API service — all task CRUD operations.
 */
import { api } from "./client";

export const tasksApi = {
  async list({ status, due, page, limit } = {}) {
    const json = await api.get("/tasks", { query: { status, due, page, limit } });
    return { tasks: json.data, pagination: json.pagination };
  },

  async getSummary() {
    const json = await api.get("/tasks/summary");
    return json.data;
  },

  async create(payload) {
    const json = await api.post("/tasks", payload);
    return json.data;
  },

  async update(id, payload) {
    const json = await api.patch(`/tasks/${id}`, payload);
    return json.data;
  },

  async toggle(id) {
    const json = await api.patch(`/tasks/${id}/toggle`);
    return json.data;
  },

  async remove(id) {
    await api.del(`/tasks/${id}`);
  },
};
