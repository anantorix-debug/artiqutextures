"use client";

import { useMemo, useState } from "react";
import { Check, Globe, Palette, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "./tab-kit";
import { useColors, useGalleryPublish, useMaterials, usePhotos, useProjectGalleryEntry } from "@/hooks/use-project-management";
import { useGalleryCategories } from "@/hooks/use-gallery";
import { fileUrl, formatDate, formatNumber } from "@/lib/format";
import type { ProjectTracking } from "@/types/entities";

const TAG_PRESETS = ["Residential", "Commercial", "Interior", "Exterior", "Texture", "Wallpaper", "Metallic"];
const NONE = "NONE";

/**
 * Publish a completed project to the Gallery without re-entering anything:
 * title, description, completion date, materials and colors come from the
 * project; only the photos to display (and the labels) are chosen here.
 */
export function PublishGalleryDialog({ project, open, onOpenChange }: { project: ProjectTracking; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: photos } = usePhotos(project.id);
  const { data: materials } = useMaterials(project.id);
  const { data: colors } = useColors(project.id);
  const { data: existing } = useProjectGalleryEntry(project.id);
  const { data: categories } = useGalleryCategories();
  const { publish, unpublish } = useGalleryPublish(project.id);

  const finished = useMemo(() => (photos ?? []).filter((p) => p.stage === "FINISHED"), [photos]);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [featured, setFeatured] = useState<boolean | null>(null);
  const [active, setActive] = useState<boolean | null>(null);
  const [customTag, setCustomTag] = useState("");

  // Effective values: what the user changed, else the existing entry, else sensible defaults.
  const existingIds = existing?.photos?.map((p) => p.fileUrl) ?? [];
  const effSelected =
    selected ??
    (existing
      ? (photos ?? []).filter((p) => existingIds.includes(p.fileUrl)).map((p) => p.id)
      : finished.map((p) => p.id));
  const effTitle = title ?? existing?.title ?? project.projectName;
  const effDescription = description ?? existing?.description ?? project.remarks ?? "";
  const effTags = tags ?? existing?.tags ?? [];
  const effCategory = categoryId ?? existing?.categoryId ?? NONE;
  const effFeatured = featured ?? existing?.isFeatured ?? false;
  const effActive = active ?? (existing ? existing.status === "ACTIVE" : true);

  const toggle = (id: string) =>
    setSelected(effSelected.includes(id) ? effSelected.filter((x) => x !== id) : [...effSelected, id]);
  const toggleTag = (t: string) => setTags(effTags.includes(t) ? effTags.filter((x) => x !== t) : [...effTags, t]);
  const allTags = [...TAG_PRESETS, ...effTags.filter((t) => !TAG_PRESETS.includes(t))];

  function submit() {
    publish.mutate(
      {
        photoIds: effSelected,
        title: effTitle.trim() || undefined,
        description: effDescription.trim() || undefined,
        categoryId: effCategory === NONE ? undefined : effCategory,
        tags: effTags.join(", "),
        isFeatured: effFeatured,
        status: effActive ? "ACTIVE" : "INACTIVE",
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(48rem,calc(100%-2rem))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> {existing ? "Update gallery entry" : "Publish to Gallery"}
          </DialogTitle>
          <DialogDescription>
            Everything below is pulled from the project — just choose the photos to display.
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Photos to display ({effSelected.length} selected)</Label>
            {(photos?.length ?? 0) > 0 && (
              <div className="flex gap-1">
                <Button type="button" size="xs" variant="ghost" onClick={() => setSelected(finished.map((p) => p.id))}>Finished only</Button>
                <Button type="button" size="xs" variant="ghost" onClick={() => setSelected((photos ?? []).map((p) => p.id))}>All</Button>
                <Button type="button" size="xs" variant="ghost" onClick={() => setSelected([])}>None</Button>
              </div>
            )}
          </div>
          {(photos?.length ?? 0) === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              Upload project photos first (Photos tab) — mark the best ones as “Finished”.
            </p>
          ) : (
            <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded-lg border p-2 sm:grid-cols-5">
              {(photos ?? []).map((p) => {
                const on = effSelected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-pressed={on}
                    className={cn("relative aspect-square overflow-hidden rounded-md border-2 transition", on ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileUrl(p.fileUrl)} alt={p.caption ?? ""} className="h-full w-full object-cover" />
                    {on && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] font-medium uppercase text-white">{p.stage}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input value={effTitle} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={3} value={effDescription} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={effCategory} onValueChange={(v) => v && setCategoryId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{categories?.find((c) => c.id === effCategory)?.name ?? "No category"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No category</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Add a label" hint="Press Enter to add">
            <Input
              placeholder="e.g. Villa"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customTag.trim()) {
                  e.preventDefault();
                  if (!effTags.includes(customTag.trim())) setTags([...effTags, customTag.trim()]);
                  setCustomTag("");
                }
              }}
            />
          </Field>
        </div>

        <div>
          <Label className="mb-1.5 block">Filter labels</Label>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                aria-pressed={effTags.includes(t)}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", effTags.includes(t) ? "border-foreground bg-foreground text-background" : "hover:bg-muted")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Completion date</p>
            <p className="font-medium">{formatDate(project.actualCompletionDate ?? project.updatedAt)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Boxes className="h-3 w-3" /> Materials included</p>
            <p className="font-medium">
              {materials?.items.length ? materials.items.slice(0, 3).map((m) => `${m.name} (${formatNumber(m.quantity)} ${m.unit})`).join(", ") : "None recorded"}
              {(materials?.items.length ?? 0) > 3 && ` +${materials!.items.length - 3}`}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Palette className="h-3 w-3" /> Colors included</p>
            {colors?.length ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {colors.map((c) => (
                  <span key={c.id} title={`${c.name} ${c.hexCode}`} className="h-5 w-5 rounded-full border shadow-sm" style={{ background: c.hexCode }} />
                ))}
              </div>
            ) : (
              <p className="font-medium">None recorded</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={effActive} onCheckedChange={setActive} /> Visible on public website
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={effFeatured} onCheckedChange={setFeatured} /> Featured
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {existing ? (
            <Button variant="ghost" className="text-destructive" disabled={unpublish.isPending} onClick={() => unpublish.mutate(undefined, { onSuccess: () => onOpenChange(false) })}>
              Remove from gallery
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={effSelected.length === 0 || !effTitle.trim() || publish.isPending} onClick={submit}>
              {publish.isPending ? "Publishing…" : existing ? "Update gallery" : "Publish to gallery"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
