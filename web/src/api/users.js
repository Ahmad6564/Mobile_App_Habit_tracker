/**
 * Users API service — profile, search, follow/unfollow.
 */
import { api } from "./client";

export const usersApi = {
  async getMe() {
    const json = await api.get("/users/me");
    return json.data;
  },

  async updateProfile(payload) {
    const json = await api.patch("/users/me", payload);
    return json.data;
  },

  async deleteAccount() {
    await api.del("/users/me");
  },

  async search(q, { page, limit } = {}) {
    const json = await api.get("/users/search", { query: { q, page, limit } });
    return { users: json.data, pagination: json.pagination };
  },

  async getByUsername(username) {
    const json = await api.get(`/users/${username}`);
    return json.data;
  },

  async follow(username) {
    const json = await api.post(`/users/${username}/follow`);
    return json.data;
  },

  async unfollow(username) {
    await api.del(`/users/${username}/follow`);
  },

  async registerPushToken(token, platform) {
    await api.post("/users/me/push-token", { token, platform });
  },

  async removePushToken(token) {
    await api.del("/users/me/push-token", { body: { token } });
  },
};
