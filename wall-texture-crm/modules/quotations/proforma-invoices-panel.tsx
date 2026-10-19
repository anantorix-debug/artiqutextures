"use client";

import { useState } from "react";
import { Download, FileText, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDateTime } from "@/lib/format";
import { useProformaInvoiceMutations, useProformaInvoices } from "@/hooks/use-proforma-invoices";

/** Generated Proforma Invoices for a quotation — each is a frozen snapshot with its own number. */
export function ProformaInvoicesPanel({ quotationId }: { quotationId: string }) {
  const { data: invoices, isLoading } = useProformaInvoices(quotationId);
  const { generate, remove, download, print } = useProformaInvoiceMutations(quotationId);
  const [toDelete, setToDelete] = useState<string | null>(null);

  return (
    <Card className="shadow-sm">
      <CardHeader className="!flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" /> Proforma Invoices
        </CardTitle>
        <Button size="sm" onClick={() => generate.mutate()} disabled={generate.isPending}>
          <Plus className="h-3.5 w-3.5" /> {generate.isPending ? "Generating…" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !invoices || invoices.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            No proforma invoices yet. Items, totals and terms are frozen at generation time; amount received / balance
            due always reflect current payments.
          </p>
        ) : (
          <ul className="divide-y">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(inv.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Download"
                    disabled={download.isPending}
                    onClick={() => download.mutate({ id: inv.id, invoiceNumber: inv.invoiceNumber })}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Print"
                    disabled={print.isPending}
                    onClick={() => print.mutate(inv.id)}
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-destructive"
                    aria-label="Delete"
                    onClick={() => setToDelete(inv.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this proforma invoice?"
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete);
          setToDelete(null);
        }}
      />
    </Card>
  );
}
