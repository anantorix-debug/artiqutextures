"use client";

import Link from "next/link";
import { Download, ExternalLink, FileImage, FileText, Files, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, TabLoading } from "./tab-kit";
import { StatusBadge } from "@/components/shared/status-badge";
import { useColors, useExpenses } from "@/hooks/use-project-management";
import { useDownloadQuotationPdf } from "@/hooks/use-quotations";
import { fileUrl, formatCurrency, formatDate } from "@/lib/format";
import type { ProjectTracking } from "@/types/entities";

/** One place for every file that belongs to the project: quotation PDF, expense receipts, color references. */
export function DocumentsTab({ project }: { project: ProjectTracking }) {
  const { data: expenses, isLoading } = useExpenses(project.id, {});
  const { data: colors } = useColors(project.id);
  const download = useDownloadQuotationPdf();
  const q = project.quotation;

  const receipts = (expenses?.items ?? []).filter((e) => e.receiptUrl);
  const refs = (colors ?? []).filter((c) => c.referenceImageUrl);

  if (isLoading) return <TabLoading />;

  return (
    <div className="space-y-4">
      {q && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" /> Quotation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {q.quotationNumber} <StatusBadge status={q.status} />
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(q.quotationDate)} · {formatCurrency(q.grandTotal)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/quotations/${q.id}/preview`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm hover:bg-muted">
                <ExternalLink className="h-4 w-4" /> Preview
              </Link>
              <Button variant="outline" disabled={download.isPending} onClick={() => download.mutate({ id: q.id, quotationNumber: q.quotationNumber })}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Receipt className="h-4 w-4" /> Expense receipts ({receipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No receipts attached. Add one when recording an expense.</p>
          ) : (
            <ul className="divide-y">
              {receipts.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.expenseDate)} · {formatCurrency(e.amount)}
                      {e.vendor ? ` · ${e.vendor}` : ""}
                    </p>
                  </div>
                  <a href={fileUrl(e.receiptUrl)} target="_blank" rel="noreferrer" className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs hover:bg-muted">
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileImage className="h-4 w-4" /> Color reference images ({refs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reference images attached to colors.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {refs.map((c) => (
                <a key={c.id} href={fileUrl(c.referenceImageUrl)} target="_blank" rel="noreferrer" className="group block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fileUrl(c.referenceImageUrl)} alt={c.name} className="aspect-square w-full rounded-lg border object-cover" />
                  <p className="mt-1 truncate text-xs group-hover:underline">{c.name}</p>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!q && receipts.length === 0 && refs.length === 0 && <EmptyState icon={Files} title="No documents yet" />}
    </div>
  );
}
