/**
 * Habits API service — all habit CRUD, logging, analytics.
 */
import { api } from "./client";

export const habitsApi = {
  async list() {
    const json = await api.get("/habits");
    return json.data;
  },

  async getPresets() {
    const json = await api.get("/habits/presets");
    return json.data;
  },

  async getSummary() {
    const json = await api.get("/habits/summary");
    return json.data;
  },

  async getMatrix(year, month) {
    const json = await api.get("/habits/matrix", { query: { year, month } });
    return json.data;
  },

  async getArchived() {
    const json = await api.get("/habits/archived");
    return json.data;
  },

  async getById(id) {
    const json = await api.get(`/habits/${id}`);
    return json.data;
  },

  async create(payload) {
    const json = await api.post("/habits", payload);
    return json.data;
  },

  async update(id, payload) {
    const json = await api.patch(`/habits/${id}`, payload);
    return json.data;
  },

  async archive(id) {
    await api.del(`/habits/${id}`);
  },

  async restore(id) {
    const json = await api.post(`/habits/${id}/restore`);
    return json.data;
  },

  async log(id, { date, value, note, mood } = {}) {
    const json = await api.post(`/habits/${id}/log`, { date, value, note, mood });
    return json.data;
  },

  async deleteLog(id, date) {
    const json = await api.del(`/habits/${id}/log/${date}`);
    return json.data;
  },

  async getLogs(id, from, to) {
    const json = await api.get(`/habits/${id}/logs`, { query: { from, to } });
    return json.data;
  },

  async getAnalytics(id) {
    const json = await api.get(`/habits/${id}/analytics`);
    return json.data;
  },

  async useShield(id) {
    const json = await api.post(`/habits/${id}/shield`);
    return json.data;
  },
};
