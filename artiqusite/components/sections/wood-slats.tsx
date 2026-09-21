import { Reveal } from "@/components/reveal";
import { TIMBER_STOPS, WoodSlatWall } from "@/components/texture/wood-slat-wall";

const TIMBERS = [
  { name: "Teak", spec: "38 mm · oiled", stops: TIMBER_STOPS.teak },
  { name: "White oak", spec: "32 mm · hardwax", stops: TIMBER_STOPS.whiteOak },
  { name: "Ash", spec: "32 mm · clear matt", stops: TIMBER_STOPS.ash },
  { name: "Charred pine", spec: "45 mm · shou sugi", stops: TIMBER_STOPS.charredPine },
];

export function WoodSlats() {
  return (
    <section id="wood-slats" className="grid grid-cols-1 items-stretch bg-ink lg:grid-cols-2 lg:min-h-[800px]">
      <Reveal className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-24 lg:py-20">
        <p className="text-eyebrow text-brass/80">WOOD SLATS</p>
        <h2 className="text-head-1 mt-6 text-paper">
          Battens, set to
          <br />
          your ceiling.
        </h2>
        <p className="text-body mt-6 max-w-[452px] text-paper/66">
          We size the batten and the reveal to the room, not to a catalogue. Panels come backed with acoustic felt,
          so a hard living room stops ringing the moment they go up.
        </p>

        <ul className="mt-10 divide-y divide-paper/12 border-t border-paper/12">
          {TIMBERS.map((timber) => (
            <li key={timber.name} className="flex items-center gap-5 py-4">
              <WoodSlatWall timber={timber.stops} seed={timber.name} className="h-[42px] w-[70px] shrink-0 rounded-[1px]" />
              <span className="text-head-4 text-paper">{timber.name}</span>
              <span className="text-caption ml-auto text-paper/55">{timber.spec}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delayMs={100} className="h-[320px] self-stretch sm:h-[420px] lg:h-auto">
        <WoodSlatWall timber={TIMBER_STOPS.teak} seed="wood-slats-panel" className="h-full w-full" />
      </Reveal>
    </section>
  );
}
