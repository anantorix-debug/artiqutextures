const MATERIALS = [
  "LIME PLASTER",
  "MICRO-CEMENT",
  "TRAVERTINE",
  "SUEDE MATT",
  "METALLIC OXIDE",
  "CHARRED OAK",
  "TEAK BATTEN",
  "ASH FLUTE",
  "ROMAN CLAY",
];

export function MaterialBand() {
  const items = [...MATERIALS, ...MATERIALS];
  return (
    <div className="relative h-16 overflow-hidden bg-ink">
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #1a2233 0%, rgba(26,34,51,0) 8%, rgba(26,34,51,0) 92%, #1a2233 100%)",
        }}
      />
      <div className="animate-marquee flex h-full w-max items-center gap-3 whitespace-nowrap">
        {[...items, ...items].map((m, i) => (
          <span key={i} className="text-[11px] font-bold tracking-[0.22em] text-paper/62">
            {m}
            <span className="ml-3 text-brass/70">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
