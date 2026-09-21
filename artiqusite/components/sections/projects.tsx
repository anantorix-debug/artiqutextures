import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { PlasterSwatch } from "@/components/texture/plaster-swatch";
import { TIMBER_STOPS, WoodSlatWall } from "@/components/texture/wood-slat-wall";
import { PortfolioViewDialog } from "@/components/forms/portfolio-view-dialog";
import { assetUrl, getPublicGallery } from "@/lib/api";

// Design-fidelity fallback shown only if the CRM's public API is unreachable.
const FALLBACK_PROJECTS = [
  { id: "fallback-0", name: "Neelankarai villa", meta: "Roman clay, 4 rooms · 2025", kind: "plaster" as const, color: "#b08d80" },
  { id: "fallback-1", name: "Alwarpet apartment", meta: "Teak slat feature wall · 2025", kind: "wood" as const },
  { id: "fallback-2", name: "Besant Nagar studio", meta: "Micro-cement, full shell · 2024", kind: "plaster" as const, color: "#a4a49e" },
];

export async function Projects() {
  const items = await getPublicGallery("PORTFOLIO", 9);

  return (
    <section id="projects" className="bg-paper px-6 py-24 sm:px-10 lg:px-24">
      <div className="mx-auto max-w-[1248px]">
        <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-eyebrow text-ink/55">RECENT WORK</p>
            <span className="mt-4 block h-[2px] w-[34px] bg-brass" />
            <h2 className="text-head-2 mt-6 text-ink">
              Rooms we have
              <br />
              resurfaced.
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.length > 0
            ? items.map((item, i) => (
                <Reveal key={item.id} delayMs={i * 90}>
                  <PortfolioViewDialog
                    item={item}
                    trigger={
                      <div className="group relative aspect-square overflow-hidden rounded-[3px] bg-plaster shadow-[0px_12px_15px_0px_rgba(27,36,54,0.12)] transition-transform hover:-translate-y-0.5">
                        <Image
                          src={assetUrl(item.thumbnailUrl || item.imageUrl)}
                          alt={item.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/40 group-hover:opacity-100">
                          <span className="rounded-[2px] border border-paper/70 px-5 py-2.5 text-[13px] font-semibold tracking-[0.01em] text-paper">
                            View project
                          </span>
                        </div>
                      </div>
                    }
                  />
                  <h3 className="text-head-4 mt-4 text-ink">{item.title}</h3>
                  {item.subtitle && <p className="text-small mt-1 text-ink-soft/75">{item.subtitle}</p>}
                </Reveal>
              ))
            : FALLBACK_PROJECTS.map((project, i) => (
                <Reveal key={project.id} delayMs={i * 90}>
                  <div className="overflow-hidden rounded-[3px] shadow-[0px_12px_15px_0px_rgba(27,36,54,0.12)]">
                    {project.kind === "wood" ? (
                      <WoodSlatWall timber={TIMBER_STOPS.teak} seed={project.name} className="aspect-square w-full" />
                    ) : (
                      <PlasterSwatch baseColor={project.color} seed={project.name} className="aspect-square w-full" />
                    )}
                  </div>
                  <h3 className="text-head-4 mt-4 text-ink">{project.name}</h3>
                  <p className="text-small mt-1 text-ink-soft/75">{project.meta}</p>
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
