import type { NextConfig } from "next";

// The backend serves uploaded images from /uploads. Allow whichever host the
// site is configured to talk to (localhost in dev, the LAN IP when testing on a
// phone, the real domain in production) — plus localhost as a fallback.
function apiHost() {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api");
    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      port: u.port,
    };
  } catch {
    return null;
  }
}

const hosts = [apiHost(), { protocol: "http" as const, hostname: "localhost", port: "3001" }].filter(
  (h): h is NonNullable<ReturnType<typeof apiHost>> => !!h,
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: hosts.map((h) => ({ ...h, pathname: "/uploads/**" })),
    // The backend is on a private/local address in dev, which Next 16's image
    // optimizer otherwise refuses as an SSRF risk. Safe here — it's our own
    // backend, not arbitrary user-supplied URLs. Revisit for production, where
    // the backend will have a real public hostname instead.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
