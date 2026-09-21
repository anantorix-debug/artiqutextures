"use client";

import { useState } from "react";
import { BadgeIndianRupee, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, formatDate, formatStatusLabel, toInputDate } from "@/lib/format";
import { PaymentMethod } from "@/types/enums";
import type { PaymentInput } from "@/services/project.service";
import type { PaymentSummary } from "@/types/entities";

function Tile({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={
          "mt-0.5 truncate text-lg font-semibold tracking-tight " +
          (tone === "good" ? "text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "")
        }
      >
        {value}
      </p>
    </div>
  );
}

export function AddPaymentDialog({
  open,
  onOpenChange,
  balanceDue,
  suggested,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  balanceDue: number;
  suggested?: number;
  pending?: boolean;
  onSubmit: (v: PaymentInput) => void;
}) {
  const [date, setDate] = useState(toInputDate(new Date().toISOString()));
  const [amount, setAmount] = useState(suggested && suggested > 0 ? String(suggested) : "");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const n = Number(amount);
  const valid = Number.isFinite(n) && n > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>Balance due: {formatCurrency(balanceDue)}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={(v) => v && setMethod(v as PaymentMethod)}>
              <SelectTrigger className="w-full">
                <SelectValue>{formatStatusLabel(method)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(PaymentMethod).map((m) => (
                  <SelectItem key={m} value={m}>{formatStatusLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reference number</Label>
            <Input placeholder="UTR / cheque no." value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!valid || pending}
            onClick={() =>
              onSubmit({
                paymentDate: date || undefined,
                amount: n,
                method,
                referenceNumber: reference || undefined,
                notes: notes || undefined,
              })
            }
          >
            {pending ? "Saving…" : "Save payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentsPanel({
  summary,
  loading,
  adding,
  onAdd,
  onRemove,
  compact,
}: {
  summary: PaymentSummary | undefined;
  loading?: boolean;
  adding?: boolean;
  onAdd: (v: PaymentInput, done: () => void) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  if (loading || !summary) {
    return (
      <Card className="shadow-sm">
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const paidPct = summary.grandTotal > 0 ? Math.min(100, Math.round((summary.amountReceived / summary.grandTotal) * 100)) : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="!flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BadgeIndianRupee className="h-4 w-4" /> Payments
        </CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Record payment
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={"grid gap-2 " + (compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4")}>
          <Tile label="Grand total" value={formatCurrency(summary.grandTotal)} />
          <Tile
            label="Advance required"
            value={formatCurrency(summary.advanceRequired)}
            tone={summary.advanceRequired > 0 && summary.advanceOutstanding === 0 ? "good" : undefined}
          />
          <Tile label="Amount received" value={formatCurrency(summary.amountReceived)} tone="good" />
          <Tile label="Balance due" value={formatCurrency(summary.balanceDue)} tone={summary.balanceDue > 0 ? "warn" : "good"} />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>
              {summary.isFullyPaid
                ? "Fully paid"
                : summary.advanceOutstanding > 0
                  ? `Advance pending: ${formatCurrency(summary.advanceOutstanding)}`
                  : "Advance received"}
            </span>
            <span>{paidPct}% paid</span>
          </div>
          <Progress value={paidPct} className="h-1.5" />
        </div>

        {summary.payments.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {summary.payments.map((p) => (
                  <tr key={p.id} className="border-b align-top last:border-0">
                    <td className="py-2">{formatDate(p.paymentDate)}</td>
                    <td className="py-2">{formatStatusLabel(p.method)}</td>
                    <td className="py-2 text-muted-foreground">
                      {p.referenceNumber || "—"}
                      {p.notes && <p className="text-xs">{p.notes}</p>}
                    </td>
                    <td className="py-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                    <td className="py-2 text-right">
                      <Button size="icon-xs" variant="ghost" className="text-destructive" aria-label="Delete payment" onClick={() => setToDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {open && (
        <AddPaymentDialog
          open={open}
          onOpenChange={setOpen}
          balanceDue={summary.balanceDue}
          suggested={summary.advanceOutstanding || undefined}
          pending={adding}
          onSubmit={(v) => onAdd(v, () => setOpen(false))}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this payment?"
        description="The received amount and balance will be recalculated."
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (toDelete) onRemove(toDelete);
          setToDelete(null);
        }}
      />
    </Card>
  );
}
