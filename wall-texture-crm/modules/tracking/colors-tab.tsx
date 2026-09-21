"use client";

import { useState } from "react";
import { Copy, Palette, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, Field, TabError, TabLoading } from "./tab-kit";
import { useColorMutations, useColors } from "@/hooks/use-project-management";
import { fileUrl } from "@/lib/format";
import type { ProjectColor } from "@/types/entities";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Text colour that stays readable on top of an arbitrary swatch. */
function readableOn(hex: string) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1a1a1a" : "#ffffff";
}

function ColorDialog({
  projectId,
  color,
  open,
  onOpenChange,
}: {
  projectId: string;
  color: ProjectColor | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { create, update } = useColorMutations(projectId);
  const [name, setName] = useState(color?.name ?? "");
  const [hex, setHex] = useState(color?.hexCode ?? "#B27608");
  const [brand, setBrand] = useState(color?.brand ?? "");
  const [shade, setShade] = useState(color?.shadeNumber ?? "");
  const [finish, setFinish] = useState(color?.finish ?? "");
  const [usedIn, setUsedIn] = useState(color?.usedIn ?? "");
  const [notes, setNotes] = useState(color?.notes ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const hexOk = HEX.test(hex);
  const valid = name.trim().length > 0 && hexOk;
  const pending = create.isPending || update.isPending;
  // <input type=color> needs a 6-digit value.
  const pickerValue = hexOk ? (hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex) : "#000000";

  function submit() {
    const values = {
      name: name.trim(),
      hexCode: hex,
      brand: brand.trim(),
      shadeNumber: shade.trim(),
      finish: finish.trim(),
      usedIn: usedIn.trim(),
      notes: notes.trim(),
    };
    const done = () => onOpenChange(false);
    if (color) update.mutate({ colorId: color.id, values: { ...values, removeReferenceImage: removeImage }, image }, { onSuccess: done });
    else create.mutate({ values, image }, { onSuccess: done });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{color ? "Edit color" : "Add color"}</DialogTitle>
          <DialogDescription>Keep the exact shade for touch-ups and repeat orders.</DialogDescription>
        </DialogHeader>

        <div
          className="flex h-16 items-center justify-center rounded-lg border text-sm font-semibold shadow-inner"
          style={{ background: hexOk ? hex : "transparent", color: hexOk ? readableOn(hex) : undefined }}
        >
          {name || "Color preview"} {hexOk && `· ${hex.toUpperCase()}`}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Color name" className="sm:col-span-2">
            <Input placeholder="e.g. Antique Gold" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="HEX code" hint={hexOk || !hex ? undefined : "Use a HEX value like #B27608"}>
            <div className="flex gap-2">
              <input
                type="color"
                aria-label="Pick color"
                value={pickerValue}
                onChange={(e) => setHex(e.target.value.toUpperCase())}
                className="h-8 w-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <Input value={hex} maxLength={7} onChange={(e) => setHex(e.target.value.startsWith("#") || !e.target.value ? e.target.value : `#${e.target.value}`)} aria-invalid={!hexOk} />
            </div>
          </Field>
          <Field label="Brand">
            <Input placeholder="e.g. Asian Paints" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <Field label="Shade number / code">
            <Input value={shade} onChange={(e) => setShade(e.target.value)} />
          </Field>
          <Field label="Finish">
            <Input placeholder="Matte, Satin, Metallic…" value={finish} onChange={(e) => setFinish(e.target.value)} />
          </Field>
          <Field label="Where it was used" className="sm:col-span-2">
            <Input placeholder="e.g. Living room feature wall" value={usedIn} onChange={(e) => setUsedIn(e.target.value)} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Field label="Reference image (optional)" className="sm:col-span-2">
            {color?.referenceImageUrl && !removeImage && !image && (
              <div className="mb-1.5 flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(color.referenceImageUrl)} alt="" className="h-12 w-12 rounded object-cover" />
                <Button type="button" size="xs" variant="ghost" className="text-destructive" onClick={() => setRemoveImage(true)}>
                  Remove
                </Button>
              </div>
            )}
            <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || pending} onClick={submit}>{pending ? "Saving…" : color ? "Save changes" : "Add color"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ColorsTab({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useColors(projectId);
  const { remove } = useColorMutations(projectId);
  const [editing, setEditing] = useState<ProjectColor | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ProjectColor | null>(null);

  if (isLoading) return <TabLoading />;
  if (isError || !data) return <TabError />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {data.length} color{data.length === 1 ? "" : "s"} used on this project
        </p>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add color
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="No colors recorded"
          hint="Save every shade used — name, HEX, brand and finish — so repeat orders and touch-ups are exact."
          action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add first color</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => {
            const ink = readableOn(c.hexCode);
            return (
              <div key={c.id} className="group overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="relative flex h-28 items-end justify-between p-3" style={{ background: c.hexCode, color: ink }}>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold leading-tight">{c.name}</p>
                    <button
                      type="button"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium opacity-90 hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard?.writeText(c.hexCode.toUpperCase());
                        toast.success(`${c.hexCode.toUpperCase()} copied`);
                      }}
                      aria-label={`Copy ${c.hexCode}`}
                    >
                      {c.hexCode.toUpperCase()} <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  {c.referenceImageUrl && (
                    <a href={fileUrl(c.referenceImageUrl)} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fileUrl(c.referenceImageUrl)} alt={`${c.name} reference`} className="h-14 w-14 rounded-md border-2 border-white/70 object-cover shadow" />
                    </a>
                  )}
                </div>
                <div className="space-y-2 p-3 text-sm">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Brand</dt>
                      <dd className="truncate font-medium">{c.brand || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Shade no.</dt>
                      <dd className="truncate font-medium">{c.shadeNumber || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Finish</dt>
                      <dd className="truncate font-medium">{c.finish || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Used in</dt>
                      <dd className="truncate font-medium">{c.usedIn || "—"}</dd>
                    </div>
                  </dl>
                  {c.notes && <p className="line-clamp-2 text-xs text-muted-foreground">{c.notes}</p>}
                  <div className="flex justify-end gap-0.5 border-t pt-2">
                    <Button size="icon-xs" variant="ghost" aria-label="Edit color" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-xs" variant="ghost" className="text-destructive" aria-label="Delete color" onClick={() => setToDelete(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && <ColorDialog key={editing?.id ?? "new"} projectId={projectId} color={editing} open={open} onOpenChange={setOpen} />}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remove this color?"
        description={toDelete ? `${toDelete.name} ${toDelete.hexCode}` : undefined}
        destructive
        confirmLabel="Remove"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
