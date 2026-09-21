import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationMeta } from "@/types/api";

export interface DashboardCards {
  totalLeads: number;
  todaysLeads: number;
  pendingFollowUps: number;
  pendingQuotations: number;
  approvedQuotations: number;
  rejectedQuotations: number;
  ongoingProjects: number;
  completedProjects: number;
  monthlyRevenue: number;
  whatsappStatus: string;
  whatsappConnected: boolean;
  galleryImages: number;
}

export interface DashboardCharts {
  monthlyRevenue: { month: string; total: number }[];
  customerGrowth: { month: string; count: number }[];
  quotationStatus: { status: string; count: number }[];
  projectStatus: { status: string; count: number }[];
  leadConversion: { status: string; count: number }[];
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  activityDate: string;
  customer?: { id: string; customerName: string };
}

export const dashboardService = {
  async getCards() {
    const res = await apiClient.get<ApiSuccessResponse<DashboardCards>>("/dashboard/cards");
    return res.data.data;
  },
  async getCharts() {
    const res = await apiClient.get<ApiSuccessResponse<DashboardCharts>>("/dashboard/charts");
    return res.data.data;
  },
  async getRecentActivities(page = 1, limit = 15) {
    const res = await apiClient.get<ApiSuccessResponse<RecentActivity[]>>("/dashboard/recent-activities", {
      params: { page, limit },
    });
    return { items: res.data.data, meta: res.data.meta as PaginationMeta };
  },
};
