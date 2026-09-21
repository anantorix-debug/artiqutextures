"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { assetUrl, type PublicGalleryItem } from "@/lib/api";
import { DesignRequestDialog } from "./design-request-dialog";
import { Portal } from "@/components/portal";

/**
 * View-only popup for a Design item (image, category, description, tags).
 * Deliberately separate from the request form — see DesignRequestDialog,
 * opened here via its own "Request this" button rather than combined into
 * one dialog.
 */
export function DesignViewDialog({ item, trigger }: { item: PublicGalleryItem; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
        {trigger}
      </button>

      {open && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 bg-ink/60" />
          <div className="relative w-full max-w-[720px] overflow-hidden rounded-[3px] bg-paper shadow-[0px_30px_60px_0px_rgba(27,36,54,0.35)]">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="relative aspect-square sm:aspect-auto">
                <Image src={assetUrl(item.thumbnailUrl || item.imageUrl)} alt={item.title} fill className="object-cover" />
              </div>

              <div className="max-h-[80vh] overflow-y-auto p-7">
                {item.category?.name && <p className="text-tag text-brass">{item.category.name}</p>}
                <h3 className="text-head-4 mt-2 text-ink">{item.title}</h3>
                {item.subtitle && <p className="text-small mt-1 text-ink-soft/70">{item.subtitle}</p>}
                {item.description && <p className="text-small mt-4 text-ink-soft/85">{item.description}</p>}
                {item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-medium text-ink/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setRequestOpen(true)}
                  className="relative mt-6 flex h-[46px] items-center overflow-hidden rounded-[2px] bg-indigo pl-6 pr-8 text-[14px] font-semibold text-paper"
                >
                  Request this
                  <span className="absolute right-0 top-0 h-full w-[6px] bg-brass" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-ink shadow"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        </Portal>
      )}

      <DesignRequestDialog designId={item.id} title={item.title} open={requestOpen} onClose={() => setRequestOpen(false)} />
    </>
  );
}
