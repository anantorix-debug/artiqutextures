"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { whatsappService, type MessageQuery } from "@/services/whatsapp.service";
import { getErrorMessage } from "@/lib/api-client";
import type { QuotationTemplateCode } from "@/types/enums";

export function useWhatsappStatus() {
  return useQuery({
    queryKey: ["whatsapp", "status"],
    queryFn: whatsappService.getStatus,
    refetchInterval: (query) => (query.state.data?.status === "CONNECTED" ? 30_000 : 3_000),
  });
}

export function useWhatsappMessages(query: MessageQuery) {
  return useQuery({
    queryKey: ["whatsapp", "messages", query],
    queryFn: () => whatsappService.listMessages(query),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });
}

export function useInitializeWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: whatsappService.initialize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "status"] });
      toast.success("Scan the QR code with WhatsApp to connect");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useLogoutWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: whatsappService.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "status"] });
      toast.success("WhatsApp disconnected");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSendText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: whatsappService.sendText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "messages"] });
      toast.success("Message queued for delivery");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}


/**
 * "Queued" is not "delivered": follow the message until WhatsApp confirms or rejects it,
 * and show that real outcome (instead of a premature success message).
 */
function trackDelivery(messageId: string, label: string, onDone: () => void) {
  const toastId = toast.loading(`${label} — sending on WhatsApp…`);
  let tries = 0;
  const tick = async () => {
    tries += 1;
    try {
      const { items } = await whatsappService.listMessages({ page: 1, limit: 20 });
      const m = items.find((x) => x.id === messageId);
      if (m && ["SENT", "DELIVERED", "READ"].includes(m.status)) {
        toast.success(`${label} — sent on WhatsApp`, { id: toastId });
        return onDone();
      }
      if (m?.status === "FAILED") {
        toast.error(`${label} — not delivered: ${(m.errorMessage ?? "WhatsApp rejected the message").replace(/\s+/g, " ").slice(0, 140)}`, { id: toastId, duration: 10000 });
        return onDone();
      }
    } catch {
      /* keep polling */
    }
    if (tries < 20) setTimeout(tick, 1500);
    else {
      toast.message(`${label} — still queued; check the WhatsApp page for its status`, { id: toastId });
      onDone();
    }
  };
  setTimeout(tick, 1200);
}

export function useSendQuotationWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotationId, phone, template }: { quotationId: string; phone?: string; template?: QuotationTemplateCode }) =>
      whatsappService.sendQuotation(quotationId, { phone, template }),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "messages"] });
      trackDelivery(message.id, "Quotation PDF", () => queryClient.invalidateQueries({ queryKey: ["whatsapp", "messages"] }));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSendGalleryImageWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ galleryId, phone }: { galleryId: string; phone: string }) =>
      whatsappService.sendGalleryImage(galleryId, phone),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "messages"] });
      trackDelivery(message.id, "Gallery image", () => queryClient.invalidateQueries({ queryKey: ["whatsapp", "messages"] }));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
