"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { proformaInvoiceService } from "@/services/proforma-invoice.service";
import { getErrorMessage } from "@/lib/api-client";
import { downloadBlob, printBlob } from "@/lib/download";

export function useProformaInvoices(quotationId: string | undefined) {
  return useQuery({
    queryKey: ["proforma-invoices", quotationId],
    queryFn: () => proformaInvoiceService.listForQuotation(quotationId as string),
    enabled: !!quotationId,
  });
}

export function useProformaInvoiceMutations(quotationId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["proforma-invoices", quotationId] });

  const generate = useMutation({
    mutationFn: () => proformaInvoiceService.generate(quotationId),
    onSuccess: (data) => {
      invalidate();
      toast.success(`Generated ${data.invoiceNumber}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => proformaInvoiceService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Proforma invoice deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const download = useMutation({
    mutationFn: async ({ id, invoiceNumber }: { id: string; invoiceNumber: string }) => {
      const blob = await proformaInvoiceService.getPdfBlob(id);
      downloadBlob(blob, `${invoiceNumber}.pdf`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const print = useMutation({
    mutationFn: async (id: string) => {
      const blob = await proformaInvoiceService.getPdfBlob(id);
      printBlob(blob);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { generate, remove, download, print };
}
