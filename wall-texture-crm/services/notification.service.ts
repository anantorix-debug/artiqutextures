import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationQuery } from "@/types/api";
import type { Notification } from "@/types/entities";

export const notificationService = {
  async list(query: PaginationQuery = {}) {
    const res = await apiClient.get<ApiSuccessResponse<Notification[]>>("/notifications", {
      params: { limit: 20, ...query },
    });
    return { items: res.data.data, meta: res.data.meta };
  },

  async markAsRead(id: string) {
    const res = await apiClient.patch<ApiSuccessResponse<Notification>>(`/notifications/${id}/read`);
    return res.data.data;
  },

  async markAllAsRead() {
    const res = await apiClient.patch<ApiSuccessResponse<{ message: string }>>("/notifications/read-all");
    return res.data.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/notifications/${id}`);
    return res.data.data;
  },
};
