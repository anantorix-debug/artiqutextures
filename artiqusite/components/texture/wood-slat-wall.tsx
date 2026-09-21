import { hashSeed, seededRandom } from "@/lib/seeded-random";

export interface TimberStops {
  dark: string;
  mid: string;
  light: string;
  shadow: string;
}

/** Exact gradient recipe Figma uses per timber — a round batten's highlight/shadow curve. */
export const TIMBER_STOPS: Record<"teak" | "whiteOak" | "ash" | "charredPine", TimberStops> = {
  teak: { dark: "#3b2415", mid: "#8a5a32", light: "#c08b4e", shadow: "#1e1009" },
  whiteOak: { dark: "#6e5330", mid: "#b08b57", light: "#dcc08a", shadow: "#1e1009" },
  ash: { dark: "#7c776b", mid: "#bab2a2", light: "#e0d9c8", shadow: "#1e1009" },
  charredPine: { dark: "#14171b", mid: "#2e3238", light: "#4e545c", shadow: "#1e1009" },
};

/**
 * Recreates the "01 Nav"-adjacent Hero slat wall / "06 Wood slats" panels:
 * a row of vertical battens rendered as CSS gradients (no photography
 * needed — Figma builds these the same procedural way), separated by dark
 * "reveal" gaps and thin grain hairlines, with an overall raking-light
 * gradient and a slight desaturate/multiply tone pass on top.
 */
export function WoodSlatWall({
  timber = TIMBER_STOPS.teak,
  seed,
  className = "",
}: {
  timber?: TimberStops;
  seed: string;
  className?: string;
}) {
  const rand = seededRandom(hashSeed(seed));
  const gradient = `linear-gradient(90deg, ${timber.dark} 1.66%, ${timber.mid} 6.49%, ${timber.light} 30.66%, ${timber.mid} 51.93%, ${timber.dark} 84.81%, ${timber.shadow} 98.34%)`;

  const slats: { widthPct: number; gapPct: number }[] = [];
  let usedPct = 0;
  while (usedPct < 100) {
    const widthPct = 4 + rand() * 5;
    const gapPct = 1.2;
    slats.push({ widthPct, gapPct });
    usedPct += widthPct + gapPct;
  }

  return (
    <div className={`relative overflow-hidden bg-[#120c07] ${className}`}>
      <div className="absolute inset-0 flex">
        {slats.map((slat, i) => (
          <div key={i} className="flex h-full" style={{ width: `${slat.widthPct}%` }}>
            <div className="h-full flex-1" style={{ backgroundImage: gradient }} />
            <div
              className="h-full shrink-0"
              style={{
                width: `${slat.gapPct}%`,
                background: "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.55), rgba(0,0,0,0.85))",
              }}
            />
          </div>
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(95.7deg, rgba(255,233,199,0.16) 6%, rgba(255,255,255,0) 46%, rgba(11,7,5,0.42) 94%)",
        }}
      />
      <div className="absolute inset-0 bg-[#7a7a7a] mix-blend-saturation opacity-30" />
      <div className="absolute inset-0 bg-[#2a1d12] mix-blend-multiply opacity-15" />
    </div>
  );
}
