import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { User } from "@/types/entities";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(payload: LoginPayload) {
    const res = await apiClient.post<ApiSuccessResponse<LoginResponse>>("/auth/login", payload);
    return res.data.data;
  },

  async logout() {
    const res = await apiClient.post<ApiSuccessResponse<{ loggedOut: boolean }>>("/auth/logout");
    return res.data.data;
  },

  async me() {
    const res = await apiClient.get<ApiSuccessResponse<User>>("/auth/me");
    return res.data.data;
  },

  async forgotPassword(email: string) {
    const res = await apiClient.post<ApiSuccessResponse<{ message: string }>>("/auth/forgot-password", {
      email,
    });
    return res.data.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await apiClient.post<ApiSuccessResponse<{ message: string }>>("/auth/reset-password", {
      token,
      newPassword,
    });
    return res.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await apiClient.post<ApiSuccessResponse<{ message: string }>>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return res.data.data;
  },
};
