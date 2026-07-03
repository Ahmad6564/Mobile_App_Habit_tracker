/**
 * Auth API service — login, register, logout, token refresh.
 */
import { api, tokenStorage, request, ApiError } from "./client";

export const authApi = {
  async login(email, password) {
    const json = await request("POST", "/auth/login", { body: { email, password }, auth: false });
    const { user, tokens } = json.data;
    tokenStorage.save(tokens.accessToken, tokens.refreshToken);
    return { user, tokens };
  },

  async register(payload) {
    const json = await request("POST", "/auth/register", { body: payload, auth: false });
    return json.data;
  },

  async googleLogin(idToken) {
    const json = await request("POST", "/auth/google", { body: { idToken }, auth: false });
    const { user, tokens, isNewUser } = json.data;
    tokenStorage.save(tokens.accessToken, tokens.refreshToken);
    return { user, tokens, isNewUser };
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenStorage.clear();
    }
  },

  async getMe() {
    const json = await api.get("/auth/me");
    return json.data;
  },

  async verifyEmail(token) {
    const json = await request("POST", "/auth/verify-email", { body: { token }, auth: false });
    return json.data;
  },

  async forgotPassword(email) {
    await request("POST", "/auth/forgot-password", { body: { email }, auth: false });
  },

  async resetPassword(token, password, userId) {
    await request("POST", "/auth/reset-password", { body: { token, password, userId }, auth: false });
  },

  async changePassword(currentPassword, newPassword) {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  },

  async resendVerification(email) {
    await request("POST", "/auth/resend-verification", { body: { email }, auth: false });
  },
};

export { ApiError };
