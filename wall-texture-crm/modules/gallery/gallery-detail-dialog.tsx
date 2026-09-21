"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight, ExternalLink, HardHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fileUrl, formatDate, formatNumber } from "@/lib/format";
import type { GalleryImage } from "@/types/entities";

/** Read-only detail of a gallery entry: photo carousel, description, materials & colors, link to the source project. */
export function GalleryDetailDialog({ item, onClose }: { item: GalleryImage | null; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  if (!item) return null;

  const urls = item.photos?.length ? item.photos.map((p) => p.fileUrl) : [item.imageUrl];
  const i = Math.min(index, urls.length - 1);
  const go = (d: number) => setIndex((i + d + urls.length) % urls.length);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(48rem,calc(100%-2rem))]">
        <DialogHeader className="pr-8">
          <DialogTitle>{item.title}</DialogTitle>
          {(item.subtitle || item.category) && <DialogDescription>{item.subtitle || item.category?.name}</DialogDescription>}
        </DialogHeader>

        <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-lg bg-black/90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileUrl(urls[i])} alt={item.title} className="max-h-[56vh] w-auto max-w-full object-contain" />
          {urls.length > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black shadow hover:bg-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => go(1)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black shadow hover:bg-white">
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{i + 1} / {urls.length}</span>
            </>
          )}
        </div>
        {urls.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {urls.map((u, n) => (
              <button key={u + n} type="button" aria-label={`Photo ${n + 1}`} onClick={() => setIndex(n)} className={cn("h-14 w-14 shrink-0 overflow-hidden rounded-md border-2", n === i ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(u)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {item.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {item.completedAt && (
            <span className="inline-flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5" /> Completed {formatDate(item.completedAt)}</span>
          )}
          {item.tags.map((t) => (
            <Badge key={t} variant="outline" className="font-normal">{t}</Badge>
          ))}
        </div>

        {(item.materialsUsed?.length ?? 0) > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium">Materials used</p>
            <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              {item.materialsUsed!.map((m, n) => (
                <li key={n} className="flex justify-between gap-3 rounded-md bg-muted/50 px-2.5 py-1.5">
                  <span className="min-w-0 truncate">{m.name}{m.brand ? ` · ${m.brand}` : ""}</span>
                  {m.quantity != null && <span className="shrink-0 font-medium">{formatNumber(m.quantity)} {m.unit}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(item.colorsUsed?.length ?? 0) > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium">Colors used</p>
            <div className="flex flex-wrap gap-2">
              {item.colorsUsed!.map((c, n) => (
                <div key={n} className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs">
                  <span className="h-5 w-5 rounded-full border" style={{ background: c.hexCode }} />
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.hexCode.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.project && (
          <Link href={`/tracking/${item.project.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline">
            <HardHat className="h-4 w-4" /> Source project: {item.project.projectName} <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </DialogContent>
    </Dialog>
  );
}
