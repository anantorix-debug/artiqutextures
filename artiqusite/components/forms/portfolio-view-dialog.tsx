"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { assetUrl, type PublicGalleryItem } from "@/lib/api";
import { Portal } from "@/components/portal";

/**
 * Portfolio items are one specific completed project, not a catalog entry —
 * view only, no "request this" form. (Only Design catalog items get the
 * request/WhatsApp flow — see DesignViewDialog + DesignRequestDialog.)
 */
export function PortfolioViewDialog({ item, trigger }: { item: PublicGalleryItem; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
        {trigger}
      </button>

      {open && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 bg-ink/70" />
          <div className="relative w-full max-w-[860px] overflow-hidden rounded-[3px] bg-paper shadow-[0px_30px_60px_0px_rgba(27,36,54,0.35)]">
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
              <Image src={assetUrl(item.thumbnailUrl || item.imageUrl)} alt={item.title} fill className="object-cover" />
            </div>
            <div className="p-6 sm:p-7">
              <h3 className="text-head-4 text-ink">{item.title}</h3>
              {item.subtitle && <p className="text-small mt-1 text-ink-soft/70">{item.subtitle}</p>}
              {item.description && <p className="text-small mt-4 text-ink-soft/85">{item.description}</p>}
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
    </>
  );
}
