"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { DesignViewDialog } from "@/components/forms/design-view-dialog";
import {
  assetUrl,
  getPublicGalleryPage,
  type PaginationMeta,
  type PublicGalleryCategory,
  type PublicGalleryItem,
} from "@/lib/api";

const PAGE_SIZE = 12;

/**
 * Full /designs catalog: starts from the server-fetched first page (so the
 * grid isn't empty on first paint / for crawlers), then loads more pages
 * client-side as the visitor scrolls near the bottom — no "page 2" link,
 * no pagination library, just one IntersectionObserver sentinel. Filtering
 * by category re-fetches page 1 for that category and resets the list.
 */
export function DesignCatalog({
  initialItems,
  initialMeta,
  categories,
}: {
  initialItems: PublicGalleryItem[];
  initialMeta: PaginationMeta | null;
  categories: PublicGalleryCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  async function selectCategory(categoryId: string | null) {
    if (categoryId === activeCategory) return;
    setActiveCategory(categoryId);
    setLoading(true);
    const first = await getPublicGalleryPage("DESIGN", 1, PAGE_SIZE, categoryId ?? undefined);
    setItems(first.items);
    setMeta(first.meta);
    setLoading(false);
  }

  const loadMore = useCallback(async () => {
    if (loading || !meta?.hasNextPage) return;
    setLoading(true);
    const next = await getPublicGalleryPage("DESIGN", meta.page + 1, PAGE_SIZE, activeCategory ?? undefined);
    setItems((prev) => [...prev, ...next.items]);
    setMeta(next.meta);
    setLoading(false);
  }, [loading, meta, activeCategory]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      {categories.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
              activeCategory === null ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink/70 hover:border-ink/40"
            }`}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat.id)}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                activeCategory === cat.id ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink/70 hover:border-ink/40"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <p className="text-small text-ink-soft/70">No designs published in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <DesignViewDialog
              key={item.id}
              item={item}
              trigger={
                <article className="group overflow-hidden rounded-[3px] bg-chalk shadow-[0px_10px_24px_0px_rgba(27,36,54,0.1)] transition-transform hover:-translate-y-0.5">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={assetUrl(item.thumbnailUrl || item.imageUrl)}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {item.category?.name && (
                      <span className="absolute left-3 top-3 rounded-[2px] bg-ink px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-paper">
                        {item.category.name.toUpperCase()}
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/40 group-hover:opacity-100">
                      <span className="rounded-[2px] border border-paper/70 px-5 py-2.5 text-[13px] font-semibold tracking-[0.01em] text-paper">
                        View design
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-head-5 text-ink">{item.title}</h3>
                    {item.description && (
                      <p className="text-small mt-2 line-clamp-2 text-ink-soft/75">{item.description}</p>
                    )}
                  </div>
                </article>
              }
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-px w-full" />
      {loading && <p className="text-small mt-8 text-center text-ink-soft/60">Loading…</p>}
      {!meta?.hasNextPage && items.length > PAGE_SIZE && (
        <p className="text-small mt-8 text-center text-ink-soft/50">You&apos;ve reached the end.</p>
      )}
    </>
  );
}
