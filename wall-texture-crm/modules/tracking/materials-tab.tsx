"use client";

import { useState } from "react";
import { Boxes, DownloadCloud, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, Field, TabError, TabLoading, TableScroll } from "./tab-kit";
import { useMaterialMutations, useMaterials } from "@/hooks/use-project-management";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ProjectMaterial } from "@/types/entities";

const UNITS = ["Sq.ft", "Sq.m", "Running ft", "Ltr", "Kg", "Bag", "Roll", "Piece", "Set"];
const NO_LINK = "NONE";

type QuotationLine = { id: string; srNo: number; productName: string; linked: boolean };

function MaterialDialog({
  projectId,
  material,
  lines,
  open,
  onOpenChange,
}: {
  projectId: string;
  material: ProjectMaterial | null;
  lines: QuotationLine[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { create, update } = useMaterialMutations(projectId);
  const [name, setName] = useState(material?.name ?? "");
  const [brand, setBrand] = useState(material?.brand ?? "");
  const [quantity, setQuantity] = useState(material ? String(Number(material.quantity)) : "");
  const [unit, setUnit] = useState(material?.unit ?? "Sq.ft");
  const [rate, setRate] = useState(material?.rate != null ? String(Number(material.rate)) : "");
  const [description, setDescription] = useState(material?.description ?? "");
  const [notes, setNotes] = useState(material?.notes ?? "");
  const [link, setLink] = useState(material?.quotationItemId ?? NO_LINK);

  const q = Number(quantity);
  const valid = name.trim().length > 0 && quantity !== "" && Number.isFinite(q) && q >= 0;
  const pending = create.isPending || update.isPending;

  /** Picking a quotation line pre-fills name and quantity so nothing is typed twice. */
  function pickLine(id: string) {
    setLink(id);
    const line = lines.find((l) => l.id === id) as (QuotationLine & { sqft?: string | number }) | undefined;
    if (line && !name.trim()) setName(line.productName);
    if (line?.sqft && !quantity) setQuantity(String(Number(line.sqft)));
  }

  function submit() {
    const values = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      quantity: q,
      unit: unit.trim() || "Sq.ft",
      rate: rate === "" ? undefined : Number(rate),
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      quotationItemId: link === NO_LINK ? undefined : link,
    };
    const done = () => onOpenChange(false);
    if (material) update.mutate({ materialId: material.id, values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  }

  const linkedLabel = lines.find((l) => l.id === link);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{material ? "Edit material" : "Add material"}</DialogTitle>
          <DialogDescription>Record exactly what was applied on site.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Link to quotation item" className="sm:col-span-2" hint="Optional — pre-fills the name and quantity from the quotation.">
            <Select value={link} onValueChange={(v) => v && (v === NO_LINK ? setLink(NO_LINK) : pickLine(v))}>
              <SelectTrigger className="w-full">
                <SelectValue>{linkedLabel ? `#${linkedLabel.srNo} · ${linkedLabel.productName}` : "Not linked"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LINK}>Not linked</SelectItem>
                {lines.map((l) => (
                  <SelectItem key={l.id} value={l.id}>#{l.srNo} · {l.productName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Material / product name" className="sm:col-span-2">
            <Input placeholder="e.g. Metallic Accent Coating" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Brand">
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <Field label="Rate / cost per unit (₹)">
            <Input type="number" min={0} step="0.01" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
          <Field label="Quantity">
            <Input type="number" min={0} step="0.01" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
          <Field label="Unit">
            <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
              <SelectTrigger className="w-full"><SelectValue>{unit}</SelectValue></SelectTrigger>
              <SelectContent>
                {(UNITS.includes(unit) ? UNITS : [unit, ...UNITS]).map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || pending} onClick={submit}>{pending ? "Saving…" : material ? "Save changes" : "Add material"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MaterialsTab({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useMaterials(projectId);
  const { remove, importFromQuotation } = useMaterialMutations(projectId);
  const [editing, setEditing] = useState<ProjectMaterial | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ProjectMaterial | null>(null);

  if (isLoading) return <TabLoading />;
  if (isError || !data) return <TabError />;

  const unlinked = data.quotationItems.filter((q) => !q.linked);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {data.items.length} material{data.items.length === 1 ? "" : "s"} recorded
          {unlinked.length > 0 && ` · ${unlinked.length} quotation item${unlinked.length === 1 ? "" : "s"} not yet added`}
        </p>
        <div className="flex flex-wrap gap-2">
          {unlinked.length > 0 && (
            <Button variant="outline" disabled={importFromQuotation.isPending} onClick={() => importFromQuotation.mutate(undefined)}>
              <DownloadCloud className="h-4 w-4" /> Import from quotation ({unlinked.length})
            </Button>
          )}
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Add material
          </Button>
        </div>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No materials recorded"
          hint="Import the products from the quotation in one click, or add materials manually."
          action={
            unlinked.length > 0 && (
              <Button onClick={() => importFromQuotation.mutate(undefined)} disabled={importFromQuotation.isPending}>
                <DownloadCloud className="h-4 w-4" /> Import from quotation
              </Button>
            )
          }
        />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Material</th>
                <th className="px-3 py-2.5 font-medium">Brand</th>
                <th className="px-3 py-2.5 text-right font-medium">Quantity</th>
                <th className="px-3 py-2.5 text-right font-medium">Rate</th>
                <th className="w-20 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr key={m.id} className="border-b align-top last:border-0 hover:bg-muted/30">
                  <td className="max-w-[320px] px-3 py-2.5">
                    <p className="break-words font-medium">{m.name}</p>
                    {m.description && <p className="break-words text-xs text-muted-foreground">{m.description}</p>}
                    {m.notes && <p className="break-words text-xs italic text-muted-foreground">{m.notes}</p>}
                    {m.quotationItem && (
                      <Badge variant="outline" className="mt-1 gap-1 px-1.5 py-0 text-[10px] font-normal">
                        <Link2 className="h-2.5 w-2.5" /> Quotation #{m.quotationItem.srNo}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{m.brand || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                    {formatNumber(m.quantity)} <span className="font-normal text-muted-foreground">{m.unit}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground">
                    {m.rate != null ? `${formatCurrency(m.rate)} / ${m.unit}` : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-0.5">
                      <Button size="icon-xs" variant="ghost" aria-label="Edit material" onClick={() => { setEditing(m); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" className="text-destructive" aria-label="Delete material" onClick={() => setToDelete(m)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}

      {open && (
        <MaterialDialog
          key={editing?.id ?? "new"}
          projectId={projectId}
          material={editing}
          lines={data.quotationItems as unknown as QuotationLine[]}
          open={open}
          onOpenChange={setOpen}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remove this material?"
        description={toDelete?.name}
        destructive
        confirmLabel="Remove"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
