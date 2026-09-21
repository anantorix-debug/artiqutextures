import { darken, lighten } from "@/lib/color";
import { hashSeed, seededRandom } from "@/lib/seeded-random";

/**
 * Recreates Aritiqu's trowel-plaster "texture engine" from Figma: a base
 * color, a soft blob of tonal variation (the real exported undertone SVG),
 * a scatter of rotated semi-transparent patches for trowel marks, a tiled
 * grain overlay, and a raking-light gradient. Figma expresses each swatch
 * as 40+ hand-placed rectangles with a fixed random seed; we regenerate the
 * same kind of noise procedurally instead of hardcoding one frozen layout,
 * so every finish/timber swatch across the site can reuse this one
 * component instead of duplicating hundreds of divs per instance.
 */
export function PlasterSwatch({
  baseColor,
  seed,
  patchCount = 14,
  lightAngle = 200,
  className = "",
}: {
  baseColor: string;
  seed: string;
  patchCount?: number;
  lightAngle?: number;
  className?: string;
}) {
  const rand = seededRandom(hashSeed(seed));
  const light = lighten(baseColor, 0.35);
  const dark = darken(baseColor, 0.4);
  const undertone = hashSeed(seed) % 2 === 0 ? "/assets/textures/undertone-01.svg" : "/assets/textures/undertone-02.svg";

  // Larger, softer patches at lower density read the same as many small
  // blurred ones but cost far less to paint — no blur filter needed.
  const patches = Array.from({ length: patchCount }).map((_, i) => {
    const size = 70 + rand() * 130;
    const aspect = 0.5 + rand() * 0.6;
    return {
      key: i,
      top: `${rand() * 100}%`,
      left: `${rand() * 100}%`,
      width: size,
      height: size * aspect,
      rotate: (rand() - 0.5) * 60,
      color: rand() > 0.5 ? light : dark,
      opacity: 0.025 + rand() * 0.06,
    };
  });

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: baseColor }}>
      <div
        className="absolute -inset-[15%] opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage: `url(${undertone})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {patches.map((p) => (
        <div
          key={p.key}
          className="absolute rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage: "url(/assets/textures/grain-tile.png)",
          backgroundSize: "128px 128px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${lightAngle}deg, rgba(255,255,255,0.18) 14%, rgba(255,255,255,0.02) 44%, rgba(27,36,54,0.12) 86%)`,
        }}
      />
    </div>
  );
}
