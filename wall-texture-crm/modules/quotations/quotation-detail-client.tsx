"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Download,
  Eye,
  HardHat,
  MessageCircle,
  Pencil,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  RejectQuotationDialog,
  ConvertToProjectDialog,
  SendQuotationWhatsAppDialog,
} from "./quotation-action-dialogs";
import {
  useDeleteQuotation,
  useDownloadQuotationPdf,
  useDuplicateQuotation,
  useQuotation,
  useQuotationPaymentMutations,
  useQuotationPayments,
  useQuotationRevisions,
  useQuotationTemplates,
  useQuotationWorkflow,
  useSwitchTemplate,
} from "@/hooks/use-quotations";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PaymentsPanel } from "@/modules/payments/payments-panel";

export function QuotationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: quotation, isLoading } = useQuotation(id);
  const { data: revisions } = useQuotationRevisions(id);
  const { send, approve, markViewed } = useQuotationWorkflow(id);
  const { data: templates } = useQuotationTemplates();
  const { data: payments, isLoading: paymentsLoading } = useQuotationPayments(id);
  const paymentMutations = useQuotationPaymentMutations(id);
  const duplicateQuotation = useDuplicateQuotation();
  const deleteQuotation = useDeleteQuotation();
  const switchTemplate = useSwitchTemplate(id);
  const downloadPdf = useDownloadQuotationPdf();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading || !quotation) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const canEdit = quotation.status !== "CONVERTED";
  const canSend = quotation.status === "DRAFT";
  const canApproveReject = ["DRAFT", "SENT", "VIEWED"].includes(quotation.status);
  const canConvert = quotation.status === "APPROVED" && !quotation.project;
  const canDelete = quotation.status !== "CONVERTED";

  return (
    <div>
      <Link href="/quotations" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Quotations
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{quotation.quotationNumber}</h1>
            <StatusBadge status={quotation.status} />
            <span className="text-xs text-muted-foreground">v{quotation.version}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {quotation.projectName} · {quotation.customer?.customerName}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push(`/quotations/${id}/preview`)}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadPdf.mutate({ id, quotationNumber: quotation.quotationNumber })}
          >
            <Download className="h-4 w-4" /> Download
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
          <Button variant="outline" onClick={() => duplicateQuotation.mutate(id)} disabled={duplicateQuotation.isPending}>
            <Copy className="h-4 w-4" /> Duplicate
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-sm">
        <span className="text-xs font-medium text-muted-foreground">Actions:</span>
        {canSend && (
          <Button size="sm" onClick={() => send.mutate()} disabled={send.isPending}>
            <Send className="h-3.5 w-3.5" /> Send to Customer
          </Button>
        )}
        {quotation.status === "SENT" && (
          <Button size="sm" variant="outline" onClick={() => markViewed.mutate()} disabled={markViewed.isPending}>
            <Eye className="h-3.5 w-3.5" /> Mark as viewed
          </Button>
        )}
        {canApproveReject && (
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
              <Button size="sm" variant="outline">
                <HardHat className="h-3.5 w-3.5" /> Convert to Project
              </Button>
            }
          />
        )}
        {quotation.project && (
          <Button size="sm" variant="outline" onClick={() => router.push(`/tracking/${quotation.project!.id}`)}>
            <HardHat className="h-3.5 w-3.5" /> View Project
          </Button>
        )}
        {canEdit && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Template:</span>
            <Select
              value={quotation.template?.code}
              onValueChange={(v) => v && switchTemplate.mutate(v as never)}
            >
              <SelectTrigger className="h-7 w-60 text-xs">
                <SelectValue>{templates?.find((t) => t.code === quotation.template?.code)?.name ?? quotation.template?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false}>
                {(templates ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.code}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {canDelete && (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {quotation.status === "REJECTED" && quotation.rejectionReason && (
        <Card className="mb-4 border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="text-sm">
            <span className="font-medium text-destructive">Rejection reason: </span>
            {quotation.rejectionReason}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y md:hidden">
                {quotation.items?.map((item) => (
                  <li key={item.id} className="space-y-1.5 py-3 first:pt-0">
                    <p className="break-words font-medium">{item.productName}</p>
                    {item.description && <p className="break-words text-xs text-muted-foreground">{item.description}</p>}
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{item.measurement || "-"}</span>
                      <span>{Number(item.sqft).toFixed(2)} sq.ft × {formatCurrency(item.rate)}</span>
                    </div>
                    <p className="text-right text-sm font-semibold">{formatCurrency(item.amount)}</p>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium">Measurement</th>
                      <th className="pb-2 text-right font-medium">Sq.ft</th>
                      <th className="pb-2 text-right font-medium">Rate</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items?.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2">
                          <p className="font-medium">{item.productName}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </td>
                        <td className="py-2 text-muted-foreground">{item.measurement || "-"}</td>
                        <td className="py-2 text-right">{Number(item.sqft).toFixed(2)}</td>
                        <td className="py-2 text-right">{formatCurrency(item.rate)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub Total</span>
                  <span>{formatCurrency(quotation.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Discount {quotation.discountType === "PERCENTAGE" ? `(${quotation.discountValue}%)` : ""}
                  </span>
                  <span>- {formatCurrency(quotation.discountAmount)}</span>
                </div>
                {quotation.gstEnabled && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST ({Number(quotation.gstPercentage)}%)</span>
                    <span>{formatCurrency(quotation.gstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transportation</span>
                  <span>{formatCurrency(quotation.transportationCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Installation</span>
                  <span>{formatCurrency(quotation.installationCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional</span>
                  <span>{formatCurrency(quotation.additionalCharges)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(quotation.grandTotal)}</span>
                </div>
                {Number(quotation.advanceRequired) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Advance required</span>
                    <span className="font-medium">{formatCurrency(quotation.advanceRequired)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <PaymentsPanel
            summary={payments}
            loading={paymentsLoading}
            adding={paymentMutations.add.isPending}
            onAdd={(values, done) => paymentMutations.add.mutate(values, { onSuccess: done })}
            onRemove={(pid) => paymentMutations.remove.mutate(pid)}
          />

          {(quotation.termsConditions || quotation.notes) && (
            <Card className="shadow-sm">
              <CardContent className="space-y-3">
                {quotation.termsConditions && (
                  <div>
                    <p className="text-sm font-medium">Terms & Conditions</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{quotation.termsConditions}</p>
                  </div>
                )}
                {quotation.notes && (
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="mt-1 text-sm text-muted-foreground">{quotation.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="space-y-2 text-sm">
              <p className="text-sm font-medium">Customer</p>
              <Link href={`/leads/${quotation.customerId}`} className="text-sm hover:underline">
                {quotation.customer?.customerName}
              </Link>
              <p className="text-muted-foreground">{quotation.customer?.phone}</p>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quotation Date</span>
                  <span>{formatDate(quotation.quotationDate)}</span>
                </div>
                {quotation.validUntil && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span>{formatDate(quotation.validUntil)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {quotation.project && (
            <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/5">
              <CardContent className="space-y-1.5 text-sm">
                <p className="text-sm font-medium">Project</p>
                <Link href={`/tracking/${quotation.project.id}`} className="flex items-center gap-1.5 hover:underline">
                  <HardHat className="h-4 w-4" /> {quotation.project.projectName}
                </Link>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={quotation.project.status} kind="project" />
                  <span>{quotation.project.progressPercentage}% complete</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Revision History</CardTitle>
            </CardHeader>
            <CardContent>
              {!revisions || revisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No revisions yet</p>
              ) : (
                <ul className="space-y-2">
                  {revisions.map((r) => (
                    <li key={r.id} className="text-sm">
                      <p className="font-medium">Version {r.versionNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this quotation?"
        destructive
        confirmLabel="Delete"
        loading={deleteQuotation.isPending}
        onConfirm={() => deleteQuotation.mutate(id, { onSuccess: () => router.push("/quotations") })}
      />
    </div>
  );
}
