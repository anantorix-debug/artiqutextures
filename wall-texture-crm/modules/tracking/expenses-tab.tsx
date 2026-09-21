"use client";

import { useState } from "react";
import { ExternalLink, Paperclip, Pencil, Plus, Receipt, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, Field, Metric, TabError, TabLoading, TableScroll } from "./tab-kit";
import { useExpenseMutations, useExpenses, useProjectSummary } from "@/hooks/use-project-management";
import { useDebounce } from "@/hooks/use-debounce";
import { fileUrl, formatCurrency, formatDate, formatStatusLabel, toInputDate } from "@/lib/format";
import { ExpenseCategory, PaymentMethod } from "@/types/enums";
import type { ProjectExpense } from "@/types/entities";

const CATEGORY_TONE: Record<string, string> = {
  MATERIAL: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  LABOUR: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  TRANSPORTATION: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  TOOLS: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  CONTRACTOR: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  ELECTRICITY: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  MISCELLANEOUS: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

function ExpenseDialog({
  projectId,
  expense,
  open,
  onOpenChange,
}: {
  projectId: string;
  expense: ProjectExpense | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { create, update } = useExpenseMutations(projectId);
  const [date, setDate] = useState(toInputDate(expense?.expenseDate ?? new Date().toISOString()));
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "MATERIAL");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense ? String(Number(expense.amount)) : "");
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? "");
  const [vendor, setVendor] = useState(expense?.vendor ?? "");
  const [method, setMethod] = useState<PaymentMethod | "">(expense?.paymentMethod ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);

  const n = Number(amount);
  const valid = description.trim().length > 0 && Number.isFinite(n) && n >= 0 && amount !== "";
  const pending = create.isPending || update.isPending;

  function submit() {
    const values = {
      expenseDate: date || undefined,
      category,
      description: description.trim(),
      amount: n,
      paidBy: paidBy.trim(),
      vendor: vendor.trim(),
      paymentMethod: method,
      notes: notes.trim(),
    };
    const done = () => onOpenChange(false);
    if (expense) {
      update.mutate({ expenseId: expense.id, values: { ...values, removeReceipt }, receipt }, { onSuccess: done });
    } else {
      create.mutate({ values, receipt }, { onSuccess: done });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Costs recorded here reduce the project&apos;s estimated profit.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={category} onValueChange={(v) => v && setCategory(v as ExpenseCategory)}>
              <SelectTrigger className="w-full"><SelectValue>{formatStatusLabel(category)}</SelectValue></SelectTrigger>
              <SelectContent>
                {Object.values(ExpenseCategory).map((c) => (
                  <SelectItem key={c} value={c}>{formatStatusLabel(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Input placeholder="e.g. Plaster bags — 40 kg × 25" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Amount (₹)">
            <Input type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Payment method">
            <Select value={method || "NONE"} onValueChange={(v) => setMethod(!v || v === "NONE" ? "" : (v as PaymentMethod))}>
              <SelectTrigger className="w-full"><SelectValue>{method ? formatStatusLabel(method) : "Not specified"}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Not specified</SelectItem>
                {Object.values(PaymentMethod).map((m) => (
                  <SelectItem key={m} value={m}>{formatStatusLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Paid by">
            <Input placeholder="Person / account" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} />
          </Field>
          <Field label="Vendor">
            <Input placeholder="Supplier / contractor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Field label="Receipt" className="sm:col-span-2" hint="JPG, PNG, WEBP or PDF · up to 15 MB">
            {expense?.receiptUrl && !removeReceipt && !receipt && (
              <div className="mb-1.5 flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                <a href={fileUrl(expense.receiptUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline">
                  <Paperclip className="h-3.5 w-3.5" /> Current receipt
                </a>
                <Button type="button" size="xs" variant="ghost" className="text-destructive" onClick={() => setRemoveReceipt(true)}>
                  Remove
                </Button>
              </div>
            )}
            <Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || pending} onClick={submit}>
            {pending ? "Saving…" : expense ? "Save changes" : "Add expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExpensesTab({ projectId }: { projectId: string }) {
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const filters = { category: category || undefined, from: from || undefined, to: to || undefined, search: debounced || undefined };
  const hasFilters = !!(category || from || to || search);

  const { data, isLoading, isError } = useExpenses(projectId, filters);
  const { data: summary } = useProjectSummary(projectId);
  const { remove } = useExpenseMutations(projectId);
  const [editing, setEditing] = useState<ProjectExpense | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ProjectExpense | null>(null);

  const profit = summary?.estimatedProfit ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Project / quotation value" value={formatCurrency(summary?.projectValue)} />
        <Metric label="Total expenses" value={formatCurrency(summary?.totalExpenses)} hint={`${summary?.expenseCount ?? 0} records`} tone="warn" />
        <Metric label="Estimated profit" value={formatCurrency(profit)} tone={profit < 0 ? "bad" : "good"} />
        <Metric label="Profit margin" value={`${summary?.profitMargin ?? 0}%`} tone={(summary?.profitMargin ?? 0) < 0 ? "bad" : "good"} />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search description, vendor…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category || "ALL"} onValueChange={(v) => setCategory(!v || v === "ALL" ? "" : (v as ExpenseCategory))}>
          <SelectTrigger className="w-full lg:w-44"><SelectValue>{category ? formatStatusLabel(category) : "All categories"}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {Object.values(ExpenseCategory).map((c) => (
              <SelectItem key={c} value={c}>{formatStatusLabel(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full lg:w-36" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full lg:w-36" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setCategory(""); setFrom(""); setTo(""); setSearch(""); }}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
        <Button className="lg:ml-auto" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add expense
        </Button>
      </div>

      {isLoading ? (
        <TabLoading />
      ) : isError ? (
        <TabError />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={hasFilters ? "No expenses match these filters" : "No expenses recorded yet"}
          hint={hasFilters ? "Try clearing the filters." : "Add material purchases, labour, transport and other costs to see the real profit on this project."}
          action={!hasFilters && <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add first expense</Button>}
        />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 font-medium">Vendor / paid by</th>
                <th className="px-3 py-2.5 font-medium">Method</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="w-24 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id} className="border-b align-top last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-2.5">{formatDate(e.expenseDate)}</td>
                  <td className="px-3 py-2.5">
                    <Badge className={"border-0 font-medium " + CATEGORY_TONE[e.category]}>{formatStatusLabel(e.category)}</Badge>
                  </td>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <p className="break-words font-medium">{e.description}</p>
                    {e.notes && <p className="break-words text-xs text-muted-foreground">{e.notes}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {e.vendor || "—"}
                    {e.paidBy && <p className="text-xs">Paid by {e.paidBy}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{e.paymentMethod ? formatStatusLabel(e.paymentMethod) : "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium">{formatCurrency(e.amount)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-0.5">
                      {e.receiptUrl && (
                        <a href={fileUrl(e.receiptUrl)} target="_blank" rel="noreferrer" aria-label="View receipt" className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button size="icon-xs" variant="ghost" aria-label="Edit expense" onClick={() => { setEditing(e); setDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" className="text-destructive" aria-label="Delete expense" onClick={() => setToDelete(e)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/40 font-semibold">
                <td className="px-3 py-3" colSpan={5}>
                  Total {hasFilters ? "(filtered)" : ""} · {data.count} {data.count === 1 ? "expense" : "expenses"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(data.total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </TableScroll>
      )}

      {dialogOpen && (
        <ExpenseDialog key={editing?.id ?? "new"} projectId={projectId} expense={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this expense?"
        description={toDelete ? `${toDelete.description} — ${formatCurrency(toDelete.amount)}` : undefined}
        destructive
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
