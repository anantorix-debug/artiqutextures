"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { quotationService, type QuotationFormValues, type QuotationQuery } from "@/services/quotation.service";
import { getErrorMessage } from "@/lib/api-client";
import { downloadBlob } from "@/lib/download";
import type { QuotationTemplateCode } from "@/types/enums";
import type { PaymentInput } from "@/services/project.service";

export function useQuotationTemplates() {
  return useQuery({ queryKey: ["quotation-templates"], queryFn: quotationService.listTemplates });
}

export function useQuotations(query: QuotationQuery) {
  return useQuery({
    queryKey: ["quotations", query],
    queryFn: () => quotationService.list(query),
    placeholderData: (prev) => prev,
  });
}

export function useQuotation(id: string | undefined) {
  return useQuery({
    queryKey: ["quotations", id],
    queryFn: () => quotationService.get(id as string),
    enabled: !!id,
  });
}

export function useQuotationRevisions(id: string | undefined) {
  return useQuery({
    queryKey: ["quotations", id, "revisions"],
    queryFn: () => quotationService.listRevisions(id as string),
    enabled: !!id,
  });
}

export function useQuotationPayments(id: string | undefined) {
  return useQuery({
    queryKey: ["quotations", id, "payments"],
    queryFn: () => quotationService.payments(id as string),
    enabled: !!id,
  });
}

export function useQuotationPaymentMutations(id: string) {
  const queryClient = useQueryClient();
  const done = (msg: string) => () => {
    queryClient.invalidateQueries({ queryKey: ["quotations", id, "payments"] });
    queryClient.invalidateQueries({ queryKey: ["project"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    toast.success(msg);
  };
  const add = useMutation({
    mutationFn: (values: PaymentInput) => quotationService.addPayment(id, values),
    onSuccess: done("Payment recorded"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (paymentId: string) => quotationService.removePayment(id, paymentId),
    onSuccess: done("Payment deleted"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  return { add, remove };
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["quotations"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["customers"] });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: QuotationFormValues) => quotationService.create(payload),
    onSuccess: (data) => {
      invalidate(queryClient);
      toast.success(`Quotation ${data.quotationNumber} created`);
      router.push(`/quotations/${data.id}/preview`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateQuotation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<QuotationFormValues>) => quotationService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
      invalidate(queryClient);
      toast.success("Quotation updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotationService.remove(id),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Quotation deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDuplicateQuotation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) => quotationService.duplicate(id),
    onSuccess: (data) => {
      invalidate(queryClient);
      toast.success(`Duplicated as ${data.quotationNumber}`);
      router.push(`/quotations/${data.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSwitchTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateCode: QuotationTemplateCode) => quotationService.switchTemplate(id, templateCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
      toast.success("Template switched");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useQuotationWorkflow(id: string) {
  const queryClient = useQueryClient();

  function onOk(message: string) {
    return () => {
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
      invalidate(queryClient);
      toast.success(message);
    };
  }

  const send = useMutation({
    mutationFn: () => quotationService.send(id),
    onSuccess: onOk("Quotation marked as sent"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const markViewed = useMutation({
    mutationFn: () => quotationService.markViewed(id),
    onSuccess: onOk("Marked as viewed"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const approve = useMutation({
    mutationFn: () => quotationService.approve(id),
    onSuccess: onOk("Quotation approved"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const reject = useMutation({
    mutationFn: (reason: string) => quotationService.reject(id, reason),
    onSuccess: onOk("Quotation rejected"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const convertToProject = useMutation({
    mutationFn: (payload: { startDate?: string; expectedCompletionDate?: string; assignedTeam?: string }) =>
      quotationService.convertToProject(id, payload),
    onSuccess: onOk("Converted to project"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { send, markViewed, approve, reject, convertToProject };
}

export function useDownloadQuotationPdf() {
  return useMutation({
    mutationFn: async ({
      id,
      template,
      quotationNumber,
    }: {
      id: string;
      template?: QuotationTemplateCode;
      quotationNumber: string;
    }) => {
      const blob = await quotationService.getPdfBlob(id, template);
      downloadBlob(blob, `${quotationNumber}.pdf`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePreviewQuotationPdf() {
  return useMutation({
    mutationFn: async ({ id, template }: { id: string; template?: QuotationTemplateCode }) => {
      const blob = await quotationService.getPdfBlob(id, template);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
