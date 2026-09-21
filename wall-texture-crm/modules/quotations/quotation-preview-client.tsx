"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, HardHat, MessageCircle, Pencil, Printer, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { ConvertToProjectDialog, RejectQuotationDialog, SendQuotationWhatsAppDialog } from "./quotation-action-dialogs";
import { useQuotation, useQuotationTemplates, useQuotationWorkflow, useSwitchTemplate } from "@/hooks/use-quotations";
import { quotationService } from "@/services/quotation.service";
import { getErrorMessage } from "@/lib/api-client";
import { downloadBlob, printBlob } from "@/lib/download";
import type { QuotationTemplateCode } from "@/types/enums";

/**
 * Quotation → Preview → Download / Print / WhatsApp → Approve / Reject.
 * The preview is the server-generated PDF itself, so it is by construction
 * identical to what Download, Print and WhatsApp deliver.
 */
export function QuotationPreviewClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: quotation, isLoading } = useQuotation(id);
  const { data: templates } = useQuotationTemplates();
  const { send, approve } = useQuotationWorkflow(id);
  const switchTemplate = useSwitchTemplate(id);

  const templateCode = quotation?.template?.code;
  const pdf = useQuery({
    queryKey: ["quotation-pdf", id, templateCode, quotation?.updatedAt],
    queryFn: () => quotationService.getPdfBlob(id, templateCode as QuotationTemplateCode),
    enabled: !!quotation,
    staleTime: 30_000,
  });

  if (isLoading || !quotation) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mx-auto h-[70vh] w-full max-w-3xl" />
      </div>
    );
  }

  const canEdit = quotation.status !== "CONVERTED";
  const canSend = quotation.status === "DRAFT";
  const canDecide = ["DRAFT", "SENT", "VIEWED"].includes(quotation.status);
  const canConvert = quotation.status === "APPROVED" && !quotation.project;

  async function ensureBlob(): Promise<Blob | null> {
    if (pdf.data) return pdf.data;
    try {
      return await quotationService.getPdfBlob(id, templateCode as QuotationTemplateCode);
    } catch (e) {
      toast.error(getErrorMessage(e));
      return null;
    }
  }

  return (
    <div>
      <Link href={`/quotations/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to quotation
      </Link>

      <div className="sticky top-0 z-20 -mx-1 mb-5 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold">{quotation.quotationNumber}</h1>
              <StatusBadge status={quotation.status} />
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {quotation.projectName} · {quotation.customer?.customerName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Select value={templateCode} onValueChange={(v) => v && v !== templateCode && switchTemplate.mutate(v as never)}>
                <SelectTrigger className="h-8 w-60" aria-label="Template">
                  <SelectValue>{templates?.find((t) => t.code === templateCode)?.name ?? quotation.template?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent align="end" alignItemWithTrigger={false}>
                  {(templates ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.code}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              disabled={!pdf.data}
              onClick={async () => {
                const b = await ensureBlob();
                if (b) downloadBlob(b, `${quotation.quotationNumber}.pdf`);
              }}
            >
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              variant="outline"
              disabled={!pdf.data}
              onClick={async () => {
                const b = await ensureBlob();
                if (b) printBlob(b);
              }}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <SendQuotationWhatsAppDialog
              quotation={quotation}
              trigger={
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              }
            />
            {canEdit && (
              <Button variant="outline" onClick={() => router.push(`/quotations/${id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        </div>

        {(canSend || canDecide || canConvert || quotation.project) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-xs font-medium text-muted-foreground">Next:</span>
            {canSend && (
              <Button size="sm" onClick={() => send.mutate()} disabled={send.isPending}>
                <Send className="h-3.5 w-3.5" /> Mark as sent
              </Button>
            )}
            {canDecide && (
              <>
                <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}>
                  <ThumbsUp className="h-3.5 w-3.5" /> Approve
                </Button>
                <RejectQuotationDialog
                  quotation={quotation}
                  trigger={
                    <Button size="sm" variant="outline" className="text-destructive">
                      <ThumbsDown className="h-3.5 w-3.5" /> Reject
                    </Button>
                  }
                />
              </>
            )}
            {canConvert && (
              <ConvertToProjectDialog
                quotation={quotation}
                trigger={
                  <Button size="sm">
                    <HardHat className="h-3.5 w-3.5" /> Create project
                  </Button>
                }
              />
            )}
            {quotation.project && (
              <Button size="sm" variant="outline" onClick={() => router.push(`/tracking/${quotation.project!.id}`)}>
                <HardHat className="h-3.5 w-3.5" /> Open project
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl rounded-xl bg-muted/50 p-2 sm:p-5">
        {pdf.isError ? (
          <div className="py-16 text-center text-sm text-destructive">{getErrorMessage(pdf.error)}</div>
        ) : (
          <PdfViewer blob={pdf.data} />
        )}
      </div>
    </div>
  );
}
