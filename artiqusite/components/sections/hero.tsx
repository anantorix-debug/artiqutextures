import { PlasterSwatch } from "@/components/texture/plaster-swatch";
import { TIMBER_STOPS, WoodSlatWall } from "@/components/texture/wood-slat-wall";

const STATS = [
  { value: "40+", label: "texture finishes mixed in-house" },
  { value: "7 days", label: "typical room turnaround" },
  { value: "1.2 mm", label: "applied coat, no seams" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-plaster">
      <div className="mx-auto grid max-w-[1640px] max-h-[2000px] grid-cols-1 lg:grid-cols-[1fr_628px]">
        {/* Left — copy */}
        <div className="relative z-10 flex flex-col justify-center bg-plaster px-6 py-16 sm:px-10 lg:px-24 lg:py-24">
          <p className="text-eyebrow text-ink/55">SALEM &nbsp;·&nbsp; EST. 2026</p>
          <span className="mt-4 block h-[2px] w-[34px] bg-brass" />

          <h1 className="font-display mt-6 max-w-[10ch] text-[56px] font-semibold leading-[0.96] tracking-[-0.03em] text-ink sm:text-[72px] lg:text-display lg:max-w-[11ch]">
            A wall you want to touch.
          </h1>

          <p className="text-lead mt-8 max-w-[492px] text-ink-soft/90">
            Hand-troweled texture coats and solid wood slat panels — measured, mixed and installed for your room. No
            wallpaper. No repeat pattern. Just surface.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4">
            <a
              href="#book"
              className="relative flex h-[56px] items-center overflow-hidden rounded-[2px] bg-indigo pl-8 pr-[38px] text-[15px] font-semibold tracking-[0.01em] text-paper shadow-[0px_10px_26px_0px_rgba(27,36,54,0.22)]"
            >
              Book a sample visit
              <span className="absolute right-0 top-0 h-full w-[8px] bg-brass" />
            </a>
            <a href="/designs" className="group text-[15px] font-semibold tracking-[0.01em] text-ink">
              See all designs
              <span className="mt-1 block h-px w-[150px] bg-ink/45 transition-colors group-hover:bg-ink" />
            </a>
          </div>

          <dl className="mt-16 grid grid-cols-3 gap-4 sm:gap-6">
            {STATS.map((stat, i) => (
              <div key={stat.value} className={i > 0 ? "border-l border-ink/20 pl-3 sm:pl-[18px]" : ""}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-[20px] font-semibold tracking-[-0.01em] text-ink sm:text-[26px]">{stat.value}</dd>
                <dd className="text-caption mt-2 text-ink-soft/75">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right — wood slat wall with floating sample cards */}
        <div className="relative hidden min-h-[520px] lg:block">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[70px]"
            style={{ backgroundImage: "linear-gradient(to right, rgba(26,34,51,0), rgba(26,34,51,0.3))" }}
          />
          <div className="absolute inset-0">
            <WoodSlatWall timber={TIMBER_STOPS.teak} seed="hero-slat-wall" className="h-full w-full" />
          </div>

          {/* Sample card — timber (deliberately overlaps the seam, per Figma) */}
          <div className="absolute left-[-98px] top-[69px] z-20 w-[196px] -rotate-[4deg] rounded-[3px] bg-chalk p-3 shadow-[0px_22px_40px_0px_rgba(27,36,54,0.28)]">
            <WoodSlatWall
              timber={TIMBER_STOPS.teak}
              seed="hero-sample-timber"
              className="h-[162px] w-full rounded-[2px]"
            />
            <p className="text-tag mt-3 text-ink/60">WS-11 &nbsp;·&nbsp; TEAK BATTEN</p>
            <p className="font-display mt-1 text-[17px] font-semibold tracking-[-0.003em] text-ink">38 mm profile</p>
          </div>

          {/* Sample card — plaster (deliberately overlaps the seam, per Figma) */}
          <div className="absolute left-[-182px] top-[335px] z-20 w-[236px] rotate-[3.5deg] rounded-[3px] bg-chalk p-3.5 shadow-[0px_26px_46px_0px_rgba(27,36,54,0.3)]">
            <PlasterSwatch
              baseColor="#c0a478"
              seed="hero-sample-plaster"
              lightAngle={98}
              className="size-[208px] rounded-[2px]"
            />
            <p className="text-tag mt-3 text-ink/60">LP-04 &nbsp;·&nbsp; LIME PLASTER</p>
            <p className="font-display mt-1 text-[19px] font-semibold tracking-[-0.003em] text-ink">Ochre Wash</p>
          </div>
        </div>
      </div>
    </section>
  );
}
