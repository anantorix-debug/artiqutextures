import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { PlasterSwatch } from "@/components/texture/plaster-swatch";
import { TIMBER_STOPS, WoodSlatWall } from "@/components/texture/wood-slat-wall";
import { DesignViewDialog } from "@/components/forms/design-view-dialog";
import { assetUrl, getPublicGallery } from "@/lib/api";

const PREVIEW_COUNT = 5;

// Design-fidelity fallback shown only if the CRM's public API is unreachable.
const FALLBACK_CARDS = [
  {
    id: "fallback-surface",
    eyebrow: "01 — SURFACE",
    title: "Texture coats",
    description:
      "Mineral plaster mixed on site and worked by hand, so the wall carries depth instead of a printed pattern. Breathable, wipeable, and repairable in place.",
    tags: ["Lime plaster", "Micro-cement", "Travertine", "Roman clay"],
    kind: "plaster" as const,
  },
  {
    id: "fallback-relief",
    eyebrow: "02 — RELIEF",
    title: "Wood slat panels",
    description:
      "Solid battens on an acoustic felt backing. We set the reveal to your ceiling height so the rhythm lands right, then oil-finish them on site.",
    tags: ["Teak", "White oak", "Ash", "Charred pine"],
    kind: "wood" as const,
  },
];

export async function WhatWeMake() {
  const items = await getPublicGallery("DESIGN", PREVIEW_COUNT);

  return (
    <section className="bg-paper px-6 py-24 sm:px-10 lg:px-24">
      <div className="mx-auto max-w-[1248px]">
        <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-eyebrow text-ink/55">WHAT WE MAKE</p>
            <span className="mt-4 block h-[2px] w-[34px] bg-brass" />
            <h2 className="text-head-1 mt-6 text-ink">Coat it, or line it.</h2>
            <p className="text-lead mt-6 max-w-[520px] text-ink-soft/85">
              Both start the same way: we come to your room, read the light, and leave samples on the actual wall
              before anyone commits.
            </p>
          </div>
          {items.length > 0 && (
            <Link href="/designs" className="text-small shrink-0 font-semibold text-ink underline underline-offset-4">
              View all designs
            </Link>
          )}
        </Reveal>

        {items.length > 0 ? (
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <Reveal key={item.id} delayMs={80 + i * 60}>
                <DesignViewDialog
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
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {FALLBACK_CARDS.map((card, i) => (
              <Reveal key={card.id} delayMs={80 + i * 80}>
                <article className="overflow-hidden rounded-[3px] bg-chalk shadow-[0px_14px_34px_0px_rgba(27,36,54,0.1)]">
                  {card.kind === "wood" ? (
                    <WoodSlatWall timber={TIMBER_STOPS.teak} seed={card.id} className="h-[214px] w-full" />
                  ) : (
                    <PlasterSwatch baseColor="#c3b79f" seed={card.id} className="h-[214px] w-full" />
                  )}
                  <div className="p-8">
                    <p className="text-tag text-ink/55">{card.eyebrow}</p>
                    <h3 className="text-head-3 mt-3 text-ink">{card.title}</h3>
                    <p className="text-small mt-3 max-w-[544px] text-ink-soft/85">{card.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-ink/20 px-3.5 py-[7px] text-[11px] font-medium tracking-[0.03em] text-ink/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
