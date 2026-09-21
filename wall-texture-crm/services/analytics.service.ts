import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { BusinessSummary } from "@/types/entities";

export interface MonthlySales {
  month: string;
  total: number;
  count: number;
}

export interface RevenueTrend {
  month: string;
  total: number;
  cumulative: number;
}

export interface LeadConversion {
  byStatus: { status: string; count: number }[];
  total: number;
  won: number;
  conversionRate: number;
}

export interface QuotationPerformance {
  byStatus: { status: string; count: number; totalValue: number }[];
  total: number;
  approvalRate: number;
  avgApprovalTurnaroundDays: number;
}

export interface RequestedTexture {
  productName: string;
  timesQuoted: number;
  totalSqft: number;
}

export interface ProjectProgress {
  projects: {
    id: string;
    projectName: string;
    status: string;
    progressPercentage: number;
    customer: { customerName: string };
  }[];
  byStatus: { status: string; count: number; avgProgress: number }[];
}

export interface WhatsappStatistics {
  total: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  byDirection: { direction: string; count: number }[];
  deliveryRate: number;
  failed: number;
}

export const analyticsService = {
  async businessSummary() {
    const res = await apiClient.get<ApiSuccessResponse<BusinessSummary>>("/analytics/business-summary");
    return res.data.data;
  },
  async monthlySales(months = 12) {
    const res = await apiClient.get<ApiSuccessResponse<MonthlySales[]>>("/analytics/monthly-sales", { params: { months } });
    return res.data.data;
  },
  async revenueTrends(months = 12) {
    const res = await apiClient.get<ApiSuccessResponse<RevenueTrend[]>>("/analytics/revenue-trends", { params: { months } });
    return res.data.data;
  },
  async leadConversion() {
    const res = await apiClient.get<ApiSuccessResponse<LeadConversion>>("/analytics/lead-conversion");
    return res.data.data;
  },
  async quotationPerformance() {
    const res = await apiClient.get<ApiSuccessResponse<QuotationPerformance>>("/analytics/quotation-performance");
    return res.data.data;
  },
  async mostRequestedTexture(limit = 10) {
    const res = await apiClient.get<ApiSuccessResponse<RequestedTexture[]>>("/analytics/most-requested-texture", {
      params: { limit },
    });
    return res.data.data;
  },
  async projectProgress() {
    const res = await apiClient.get<ApiSuccessResponse<ProjectProgress>>("/analytics/project-progress");
    return res.data.data;
  },
  async whatsappStatistics() {
    const res = await apiClient.get<ApiSuccessResponse<WhatsappStatistics>>("/analytics/whatsapp-statistics");
    return res.data.data;
  },
  async exportExcel() {
    const res = await apiClient.get("/analytics/export/excel", { responseType: "blob" });
    return res.data as Blob;
  },
  async exportPdf() {
    const res = await apiClient.get("/analytics/export/pdf", { responseType: "blob" });
    return res.data as Blob;
  },
};
