"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Images, Pencil, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, Field, TabError, TabLoading } from "./tab-kit";
import { useColors, useMaterials, usePhotoMutations, usePhotos } from "@/hooks/use-project-management";
import { fileUrl, formatDate, formatStatusLabel, toInputDate } from "@/lib/format";
import { PhotoStage } from "@/types/enums";
import type { ProjectPhoto } from "@/types/entities";

const ACCEPT = "image/jpeg,image/png,image/webp";
const OK_TYPE = /^image\/(jpe?g|png|webp)$/i;
const MAX_MB = 15;
const NONE = "NONE";

const STAGE_TONE: Record<string, string> = {
  BEFORE: "bg-slate-800/80 text-white",
  DURING: "bg-amber-500/90 text-white",
  FINISHED: "bg-emerald-600/90 text-white",
  DETAIL: "bg-violet-600/90 text-white",
  OTHER: "bg-gray-600/80 text-white",
};

function LinkSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; label: string }>;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-full">
        <SelectValue>{options.find((o) => o.id === value)?.label ?? placeholder}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function useLinkOptions(projectId: string) {
  const { data: materials } = useMaterials(projectId);
  const { data: colors } = useColors(projectId);
  return {
    materialOptions: (materials?.items ?? []).map((m) => ({ id: m.id, label: m.name })),
    colorOptions: (colors ?? []).map((c) => ({ id: c.id, label: `${c.name} ${c.hexCode.toUpperCase()}` })),
  };
}

function UploadDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { upload } = usePhotoMutations(projectId);
  const { materialOptions, colorOptions } = useLinkOptions(projectId);
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<PhotoStage>("FINISHED");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [takenAt, setTakenAt] = useState(toInputDate(new Date().toISOString()));
  const [materialId, setMaterialId] = useState(NONE);
  const [colorId, setColorId] = useState(NONE);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    const good = list.filter((f) => OK_TYPE.test(f.type) && f.size <= MAX_MB * 1024 * 1024);
    const bad = list.length - good.length;
    if (bad > 0) toast.error(`${bad} file${bad > 1 ? "s were" : " was"} skipped — only JPG, PNG or WEBP up to ${MAX_MB} MB`);
    setFiles((prev) => [...prev, ...good].slice(0, 30));
  }, []);

  function submit() {
    upload.mutate(
      {
        files,
        meta: {
          stage,
          caption: caption.trim() || undefined,
          description: description.trim() || undefined,
          takenAt: takenAt || undefined,
          materialId: materialId === NONE ? undefined : materialId,
          colorId: colorId === NONE ? undefined : colorId,
        },
        onProgress: setProgress,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !upload.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload photos</DialogTitle>
          <DialogDescription>Select as many images as you like — they upload together with the details below.</DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragging ? "border-foreground bg-muted" : "hover:border-foreground/40 hover:bg-muted/40",
          )}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        >
          <UploadCloud className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium">Tap to choose photos, or drag &amp; drop</p>
          <p className="text-xs text-muted-foreground">JPG, JPEG, PNG, WEBP · up to {MAX_MB} MB each · max 30 per upload</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previews[i]} alt={f.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Stage">
            <Select value={stage} onValueChange={(v) => v && setStage(v as PhotoStage)}>
              <SelectTrigger className="w-full"><SelectValue>{formatStatusLabel(stage)}</SelectValue></SelectTrigger>
              <SelectContent>
                {Object.values(PhotoStage).map((s) => (
                  <SelectItem key={s} value={s}>{formatStatusLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
          </Field>
          <Field label="Caption" className="sm:col-span-2" hint="Applied to every photo in this upload. Edit individual photos afterwards.">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Linked material (optional)">
            <LinkSelect value={materialId} onChange={setMaterialId} options={materialOptions} placeholder="None" />
          </Field>
          <Field label="Linked color (optional)">
            <LinkSelect value={colorId} onChange={setColorId} options={colorOptions} placeholder="None" />
          </Field>
        </div>

        {upload.isPending && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={upload.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={files.length === 0 || upload.isPending} onClick={submit}>
            {upload.isPending ? "Uploading…" : `Upload ${files.length || ""} photo${files.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPhotoDialog({ projectId, photo, onClose }: { projectId: string; photo: ProjectPhoto; onClose: () => void }) {
  const { update } = usePhotoMutations(projectId);
  const { materialOptions, colorOptions } = useLinkOptions(projectId);
  const [stage, setStage] = useState<PhotoStage>(photo.stage);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [description, setDescription] = useState(photo.description ?? "");
  const [takenAt, setTakenAt] = useState(toInputDate(photo.takenAt));
  const [materialId, setMaterialId] = useState(photo.materialId ?? NONE);
  const [colorId, setColorId] = useState(photo.colorId ?? NONE);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit photo</DialogTitle>
          <DialogDescription>{photo.fileName}</DialogDescription>
        </DialogHeader>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fileUrl(photo.fileUrl)} alt="" className="max-h-48 w-full rounded-lg border bg-muted object-contain" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Stage">
            <Select value={stage} onValueChange={(v) => v && setStage(v as PhotoStage)}>
              <SelectTrigger className="w-full"><SelectValue>{formatStatusLabel(stage)}</SelectValue></SelectTrigger>
              <SelectContent>
                {Object.values(PhotoStage).map((s) => (
                  <SelectItem key={s} value={s}>{formatStatusLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
          </Field>
          <Field label="Caption" className="sm:col-span-2">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Linked material">
            <LinkSelect value={materialId} onChange={setMaterialId} options={materialOptions} placeholder="None" />
          </Field>
          <Field label="Linked color">
            <LinkSelect value={colorId} onChange={setColorId} options={colorOptions} placeholder="None" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                {
                  photoId: photo.id,
                  meta: {
                    stage,
                    caption,
                    description,
                    takenAt: takenAt || undefined,
                    materialId: materialId === NONE ? undefined : materialId,
                    colorId: colorId === NONE ? undefined : colorId,
                  },
                },
                { onSuccess: onClose },
              )
            }
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
  onEdit,
  onDelete,
}: {
  photos: ProjectPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onEdit: (p: ProjectPhoto) => void;
  onDelete: (p: ProjectPhoto) => void;
}) {
  const photo = photos[index];
  const go = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, photos.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!photo) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[95vh] gap-3 overflow-y-auto p-3 sm:max-w-[min(56rem,calc(100%-2rem))] sm:p-4">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            {photo.caption || photo.fileName || "Photo"}
            <Badge className={cn("border-0", STAGE_TONE[photo.stage])}>{formatStatusLabel(photo.stage)}</Badge>
          </DialogTitle>
          <DialogDescription>
            {photos.length > 1 ? `${index + 1} of ${photos.length}` : ""}
            {photo.takenAt ? ` · ${formatDate(photo.takenAt)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex min-h-[220px] items-center justify-center rounded-lg bg-black/90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileUrl(photo.fileUrl)} alt={photo.caption ?? ""} className="max-h-[62vh] w-auto max-w-full object-contain" />
          {photos.length > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black shadow hover:bg-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => go(1)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black shadow hover:bg-white">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1 text-sm">
            {photo.description && <p className="text-muted-foreground">{photo.description}</p>}
            <div className="flex flex-wrap gap-1.5">
              {photo.material && <Badge variant="outline">Material: {photo.material.name}</Badge>}
              {photo.color && (
                <Badge variant="outline" className="gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border" style={{ background: photo.color.hexCode }} />
                  {photo.color.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(photo)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => onDelete(photo)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
          </div>
        </div>

        {photos.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => onIndex(i)}
                className={cn("h-14 w-14 shrink-0 overflow-hidden rounded-md border-2", i === index ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(p.fileUrl)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PhotosTab({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = usePhotos(projectId);
  const { remove } = usePhotoMutations(projectId);
  const [stage, setStage] = useState<PhotoStage | "ALL">("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [editing, setEditing] = useState<ProjectPhoto | null>(null);
  const [toDelete, setToDelete] = useState<ProjectPhoto | null>(null);

  const photos = useMemo(() => (data ?? []).filter((p) => stage === "ALL" || p.stage === stage), [data, stage]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data ?? []).forEach((p) => (c[p.stage] = (c[p.stage] ?? 0) + 1));
    return c;
  }, [data]);

  if (isLoading) return <TabLoading />;
  if (isError || !data) return <TabError />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {(["ALL", ...Object.values(PhotoStage)] as const).map((s) => {
            const n = s === "ALL" ? data.length : (counts[s] ?? 0);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  stage === s ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                )}
              >
                {s === "ALL" ? "All" : formatStatusLabel(s)} <span className="opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <ImagePlus className="h-4 w-4" /> Upload photos
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No photos yet"
          hint="Upload before / during / finished shots — several at once. Finished photos can be published to the Gallery."
          action={<Button onClick={() => setUploadOpen(true)}><ImagePlus className="h-4 w-4" /> Upload photos</Button>}
        />
      ) : photos.length === 0 ? (
        <EmptyState icon={Images} title={`No ${formatStatusLabel(stage)} photos`} hint="Try another stage filter." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setLightbox(i)}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted text-left shadow-sm"
              aria-label={p.caption || p.fileName || "Open photo"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(p.fileUrl)} alt={p.caption ?? ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <Badge className={cn("absolute left-2 top-2 border-0 text-[10px]", STAGE_TONE[p.stage])}>{formatStatusLabel(p.stage)}</Badge>
              {p.color && <span className="absolute right-2 top-2 h-4 w-4 rounded-full border-2 border-white shadow" style={{ background: p.color.hexCode }} />}
              {(p.caption || p.takenAt) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 text-white">
                  {p.caption && <p className="truncate text-xs font-medium">{p.caption}</p>}
                  {p.takenAt && <p className="text-[10px] opacity-80">{formatDate(p.takenAt)}</p>}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {uploadOpen && <UploadDialog projectId={projectId} open={uploadOpen} onOpenChange={setUploadOpen} />}
      {lightbox !== null && photos.length > 0 && (
        <Lightbox
          photos={photos}
          index={Math.min(lightbox, photos.length - 1)}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
          onEdit={(p) => { setLightbox(null); setEditing(p); }}
          onDelete={(p) => { setLightbox(null); setToDelete(p); }}
        />
      )}
      {editing && <EditPhotoDialog projectId={projectId} photo={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this photo?"
        description="If it is published in the Gallery, the gallery keeps its own copy of the reference."
        destructive
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
