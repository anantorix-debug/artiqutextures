import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationQuery } from "@/types/api";
import type { Customer, CustomerActivity } from "@/types/entities";
import type { LeadPriority, LeadSource, LeadStatus } from "@/types/enums";

export interface CustomerQuery extends PaginationQuery {
  status?: LeadStatus;
  priority?: LeadPriority;
  leadSource?: LeadSource;
  city?: string;
  pendingFollowUp?: "true";
}

export interface CustomerFormValues {
  customerName: string;
  companyName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  leadSource?: LeadSource;
  referredBy?: string;
  requirement?: string;
  priority?: LeadPriority;
  status?: LeadStatus;
  followUpDate?: string;
  siteVisitDate?: string;
  remarks?: string;
}

export const customerService = {
  async list(query: CustomerQuery = {}) {
    const res = await apiClient.get<ApiSuccessResponse<Customer[]>>("/customers", { params: query });
    return { items: res.data.data, meta: res.data.meta! };
  },

  async get(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<Customer>>(`/customers/${id}`);
    return res.data.data;
  },

  async getProfile(id: string) {
    const res = await apiClient.get<
      ApiSuccessResponse<{
        customer: Customer;
        activities: CustomerActivity[];
        quotations: import("@/types/entities").Quotation[];
        projects: import("@/types/entities").ProjectTracking[];
        whatsappMessages: import("@/types/entities").WhatsAppMessage[];
      }>
    >(`/customers/${id}/profile`);
    return res.data.data;
  },

  async create(payload: CustomerFormValues) {
    const res = await apiClient.post<ApiSuccessResponse<Customer>>("/customers", payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<CustomerFormValues>) {
    const res = await apiClient.patch<ApiSuccessResponse<Customer>>(`/customers/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/customers/${id}`);
    return res.data.data;
  },

  async addActivity(id: string, payload: { type?: string; title: string; description?: string; activityDate?: string }) {
    const res = await apiClient.post<ApiSuccessResponse<CustomerActivity>>(`/customers/${id}/activities`, payload);
    return res.data.data;
  },

  async exportExcel(query: CustomerQuery = {}) {
    const res = await apiClient.get("/customers/export/excel", { params: query, responseType: "blob" });
    return res.data as Blob;
  },

  async exportPdf(query: CustomerQuery = {}) {
    const res = await apiClient.get("/customers/export/pdf", { params: query, responseType: "blob" });
    return res.data as Blob;
  },
};
