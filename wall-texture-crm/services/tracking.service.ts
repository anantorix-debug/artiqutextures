import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationQuery } from "@/types/api";
import type { ProjectTracking } from "@/types/entities";
import type { ProjectStatus } from "@/types/enums";

export interface TrackingQuery extends PaginationQuery {
  status?: ProjectStatus;
  customerId?: string;
}

export interface UpdateProjectPayload {
  projectName?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  status?: ProjectStatus;
  assignedTeam?: string;
  progressPercentage?: number;
  currentStage?: string;
  remarks?: string;
}

export const trackingService = {
  async list(query: TrackingQuery = {}) {
    const res = await apiClient.get<ApiSuccessResponse<ProjectTracking[]>>("/tracking", { params: query });
    return { items: res.data.data, meta: res.data.meta! };
  },

  async get(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<ProjectTracking>>(`/tracking/${id}`);
    return res.data.data;
  },

  async update(id: string, payload: UpdateProjectPayload) {
    const res = await apiClient.patch<ApiSuccessResponse<ProjectTracking>>(`/tracking/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/tracking/${id}`);
    return res.data.data;
  },
};
