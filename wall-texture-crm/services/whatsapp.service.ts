import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationQuery } from "@/types/api";
import type { WhatsAppMessage, WhatsAppSession } from "@/types/entities";
import type { QuotationTemplateCode, WhatsAppMessageDirection, WhatsAppMessageStatus } from "@/types/enums";

export interface MessageQuery extends PaginationQuery {
  customerId?: string;
  status?: WhatsAppMessageStatus;
  direction?: WhatsAppMessageDirection;
}

export const whatsappService = {
  async getStatus() {
    const res = await apiClient.get<ApiSuccessResponse<WhatsAppSession>>("/whatsapp/status");
    return res.data.data;
  },
  async initialize() {
    const res = await apiClient.post<ApiSuccessResponse<{ message: string }>>("/whatsapp/initialize");
    return res.data.data;
  },
  async logout() {
    const res = await apiClient.post<ApiSuccessResponse<{ message: string }>>("/whatsapp/logout");
    return res.data.data;
  },
  async listMessages(query: MessageQuery = {}) {
    const res = await apiClient.get<ApiSuccessResponse<WhatsAppMessage[]>>("/whatsapp/messages", { params: query });
    return { items: res.data.data, meta: res.data.meta! };
  },
  async sendText(payload: { customerId?: string; phone?: string; content: string }) {
    const res = await apiClient.post<ApiSuccessResponse<WhatsAppMessage>>("/whatsapp/send/text", payload);
    return res.data.data;
  },
  async sendImage(payload: { customerId?: string; phone?: string; caption?: string; file: File }) {
    const formData = new FormData();
    if (payload.customerId) formData.append("customerId", payload.customerId);
    if (payload.phone) formData.append("phone", payload.phone);
    if (payload.caption) formData.append("caption", payload.caption);
    formData.append("file", payload.file);
    const res = await apiClient.post<ApiSuccessResponse<WhatsAppMessage>>("/whatsapp/send/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async sendDocument(payload: { customerId?: string; phone?: string; caption?: string; file: File }) {
    const formData = new FormData();
    if (payload.customerId) formData.append("customerId", payload.customerId);
    if (payload.phone) formData.append("phone", payload.phone);
    if (payload.caption) formData.append("caption", payload.caption);
    formData.append("file", payload.file);
    const res = await apiClient.post<ApiSuccessResponse<WhatsAppMessage>>("/whatsapp/send/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async sendQuotation(quotationId: string, payload: { phone?: string; template?: QuotationTemplateCode }) {
    const res = await apiClient.post<ApiSuccessResponse<WhatsAppMessage>>(
      `/whatsapp/send/quotation/${quotationId}`,
      payload,
    );
    return res.data.data;
  },
  async sendGalleryImage(galleryId: string, phone: string) {
    const res = await apiClient.post<ApiSuccessResponse<WhatsAppMessage>>(`/whatsapp/send/gallery/${galleryId}`, {
      phone,
    });
    return res.data.data;
  },
};
