import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationQuery } from "@/types/api";
import type { PaymentSummary, Quotation, QuotationItem, QuotationRevision, QuotationTemplate } from "@/types/entities";
import type { PaymentInput } from "@/services/project.service";
import type { DiscountType, QuotationStatus, QuotationTemplateCode } from "@/types/enums";

export interface QuotationQuery extends PaginationQuery {
  status?: QuotationStatus;
  customerId?: string;
}

export interface QuotationItemInput {
  productName: string;
  description?: string;
  measurement?: string;
  sqft: number;
  rate: number;
}

export interface QuotationFormValues {
  customerId: string;
  projectName: string;
  templateCode?: QuotationTemplateCode;
  quotationDate?: string;
  validUntil?: string;
  items: QuotationItemInput[];
  discountType?: DiscountType;
  discountValue?: number;
  gstEnabled?: boolean;
  gstPercentage?: number;
  transportationCharges?: number;
  installationCharges?: number;
  additionalCharges?: number;
  advanceRequired?: number;
  termsConditions?: string;
  notes?: string;
}

export const quotationService = {
  async listTemplates() {
    const res = await apiClient.get<ApiSuccessResponse<QuotationTemplate[]>>("/quotations/templates");
    return res.data.data;
  },

  async list(query: QuotationQuery = {}) {
    const res = await apiClient.get<ApiSuccessResponse<Quotation[]>>("/quotations", { params: query });
    return { items: res.data.data, meta: res.data.meta! };
  },

  async get(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<Quotation & { items: QuotationItem[] }>>(`/quotations/${id}`);
    return res.data.data;
  },

  async create(payload: QuotationFormValues) {
    const res = await apiClient.post<ApiSuccessResponse<Quotation>>("/quotations", payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<QuotationFormValues>) {
    const res = await apiClient.patch<ApiSuccessResponse<Quotation>>(`/quotations/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/quotations/${id}`);
    return res.data.data;
  },

  async duplicate(id: string) {
    const res = await apiClient.post<ApiSuccessResponse<Quotation>>(`/quotations/${id}/duplicate`);
    return res.data.data;
  },

  async switchTemplate(id: string, templateCode: QuotationTemplateCode) {
    const res = await apiClient.patch<ApiSuccessResponse<Quotation>>(`/quotations/${id}/template`, { templateCode });
    return res.data.data;
  },

  async send(id: string) {
    const res = await apiClient.post<ApiSuccessResponse<Quotation>>(`/quotations/${id}/send`);
    return res.data.data;
  },

  async markViewed(id: string) {
    const res = await apiClient.post<ApiSuccessResponse<Quotation>>(`/quotations/${id}/viewed`);
    return res.data.data;
  },

  async payments(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<PaymentSummary>>(`/quotations/${id}/payments`);
    return res.data.data;
  },
  async addPayment(id: string, values: PaymentInput) {
    const res = await apiClient.post<ApiSuccessResponse<PaymentSummary>>(`/quotations/${id}/payments`, values);
    return res.data.data;
  },
  async removePayment(id: string, paymentId: string) {
    const res = await apiClient.delete<ApiSuccessResponse<PaymentSummary>>(`/quotations/${id}/payments/${paymentId}`);
    return res.data.data;
  },

  async approve(id: string) {
    const res = await apiClient.post<ApiSuccessResponse<Quotation>>(`/quotations/${id}/approve`);
    return res.data.data;
  },

  async reject(id: string, rejectionReason: string) {
    const res = await apiClient.post<ApiSuccessResponse<Quotation>>(`/quotations/${id}/reject`, { rejectionReason });
    return res.data.data;
  },

  async convertToProject(id: string, payload: { startDate?: string; expectedCompletionDate?: string; assignedTeam?: string }) {
    const res = await apiClient.post<ApiSuccessResponse<{ quotation: Quotation; project: unknown }>>(
      `/quotations/${id}/convert-to-project`,
      payload,
    );
    return res.data.data;
  },

  async listRevisions(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<QuotationRevision[]>>(`/quotations/${id}/revisions`);
    return res.data.data;
  },

  async getPdfBlob(id: string, template?: QuotationTemplateCode) {
    const res = await apiClient.get(`/quotations/${id}/pdf`, {
      params: template ? { template } : undefined,
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
