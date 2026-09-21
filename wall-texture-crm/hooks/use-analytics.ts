"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { analyticsService } from "@/services/analytics.service";
import { getErrorMessage } from "@/lib/api-client";
import { downloadBlob } from "@/lib/download";

export function useBusinessSummary() {
  return useQuery({ queryKey: ["analytics", "business-summary"], queryFn: analyticsService.businessSummary });
}
export function useMonthlySales() {
  return useQuery({ queryKey: ["analytics", "monthly-sales"], queryFn: () => analyticsService.monthlySales() });
}
export function useLeadConversionAnalytics() {
  return useQuery({ queryKey: ["analytics", "lead-conversion"], queryFn: analyticsService.leadConversion });
}
export function useQuotationPerformance() {
  return useQuery({ queryKey: ["analytics", "quotation-performance"], queryFn: analyticsService.quotationPerformance });
}
export function useMostRequestedTexture() {
  return useQuery({ queryKey: ["analytics", "textures"], queryFn: () => analyticsService.mostRequestedTexture() });
}
export function useProjectProgressAnalytics() {
  return useQuery({ queryKey: ["analytics", "project-progress"], queryFn: analyticsService.projectProgress });
}
export function useWhatsappStatistics() {
  return useQuery({ queryKey: ["analytics", "whatsapp-stats"], queryFn: analyticsService.whatsappStatistics });
}

export function useExportAnalytics() {
  return useMutation({
    mutationFn: async (format: "excel" | "pdf") => {
      const blob = format === "excel" ? await analyticsService.exportExcel() : await analyticsService.exportPdf();
      downloadBlob(blob, `analytics-report.${format === "excel" ? "xlsx" : "pdf"}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
