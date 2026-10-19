import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { ProformaInvoice } from "@/types/entities";

export const proformaInvoiceService = {
  async generate(quotationId: string) {
    const res = await apiClient.post<ApiSuccessResponse<ProformaInvoice>>(
      `/quotations/${quotationId}/proforma-invoices`,
    );
    return res.data.data;
  },

  async listForQuotation(quotationId: string) {
    const res = await apiClient.get<ApiSuccessResponse<ProformaInvoice[]>>(
      `/quotations/${quotationId}/proforma-invoices`,
    );
    return res.data.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(
      `/proforma-invoices/${id}`,
    );
    return res.data.data;
  },

  async getPdfBlob(id: string) {
    const res = await apiClient.get(`/proforma-invoices/${id}/pdf`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
