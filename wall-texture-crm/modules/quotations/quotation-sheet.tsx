"use client";

import { useEffect, useRef, useState } from "react";
import { fileUrl } from "@/lib/format";
import type { CompanyProfile } from "@/types/entities";

/**
 * A4-proportioned HTML rendering of a quotation, used for the template picker
 * previews. Each theme mirrors the corresponding server-side PDF layout
 * (same section order, same colours) so what you pick is what you get in the
 * Preview / PDF / Print / WhatsApp output.
 */

export const SHEET_W = 794; // A4 @ 96dpi
export const SHEET_H = 1123;

export interface SheetItem {
  srNo: number;
  productName: string;
  description?: string;
  measurement?: string;
  sqft: number;
  rate: number;
  amount: number;
}

export interface SheetData {
  number: string;
  date: string;
  validUntil: string;
  projectName: string;
  customer: { name: string; company?: string; address: string; phone: string; email?: string };
  items: SheetItem[];
  subTotal: number;
  discountLabel: string;
  discountAmount: number;
  gstLabel?: string;
  gstAmount?: number;
  transportation: number;
  installation: number;
  additional: number;
  grandTotal: number;
  advance: number;
  words: string;
  terms: string[];
  notes?: string;
}

export const SAMPLE_SHEET: SheetData = {
  number: "QT-2026-0001",
  date: "19 Sep 2026",
  validUntil: "04 Oct 2026",
  projectName: "Villa Facade & Living Room Feature Wall",
  customer: {
    name: "Rahul Sharma",
    company: "Sharma Residence",
    address: "Plot 42, Green Park Layout, Coimbatore, Tamil Nadu 641012",
    phone: "+91 98765 43210",
    email: "rahul@example.com",
  },
  items: [
    { srNo: 1, productName: "Metallic Accent Coating", description: "Two coats, antique gold, hand-finished", measurement: "20 x 14 ft", sqft: 280, rate: 185.5, amount: 51940 },
    { srNo: 2, productName: "3D Textured Plaster", description: "Travertine effect with sealer", measurement: "10 x 8 ft", sqft: 80, rate: 320, amount: 25600 },
    { srNo: 3, productName: "Premium Wallpaper", description: "Imported, washable", measurement: "12 x 10 ft", sqft: 120, rate: 95, amount: 11400 },
  ],
  subTotal: 88940,
  discountLabel: "Discount (5%)",
  discountAmount: 4447,
  gstLabel: "GST (18%)",
  gstAmount: 15208.74,
  transportation: 1500,
  installation: 8000,
  additional: 500,
  grandTotal: 109701.74,
  advance: 54850.87,
  words: "Rupees One Lakh Nine Thousand Seven Hundred One and Seventy Four Paise Only",
  terms: [
    "50% advance payment required to confirm the order, balance on completion.",
    "Prices are valid for the validity period mentioned above.",
    "Material wastage, if any, will be billed separately.",
    "Warranty as per manufacturer terms for the applied product.",
  ],
  notes: "Site to be cleared and power/water available before work begins.",
};

export type SheetTheme = "TIME_FOR_TEXTURE" | "TFT_CLASSIC" | "TFT_MINIMAL" | "TFT_LUXURY" | "CLASSIC" | "ARTIQUE_SURFACE" | "MODERN_MINIMAL" | "LUXURY_TEXTURE";

type Layout = "classic" | "band" | "minimal" | "luxury" | "tft-band";
const LAYOUT: Record<SheetTheme, Layout> = {
  CLASSIC: "classic", ARTIQUE_SURFACE: "band", MODERN_MINIMAL: "minimal", LUXURY_TEXTURE: "luxury",
  TIME_FOR_TEXTURE: "tft-band", TFT_CLASSIC: "classic", TFT_MINIMAL: "minimal", TFT_LUXURY: "luxury",
};

interface Palette {
  /** light-on-dark text colours for the banded headers */
  dk?: { title: string; sub: string; text: string };
  primary: string;
  accent: string;
  text: string;
  muted: string;
  line: string;
  headBg: string;
  headText: string;
  zebra?: string;
  totalBg: string;
  totalText: string;
  grid: boolean;
}

const PALETTES: Record<SheetTheme, Palette> = {
  TIME_FOR_TEXTURE: { primary: "#c2410c", accent: "#ea7a1c", text: "#2b1d14", muted: "#6f5a4a", line: "#f1d5b8", headBg: "#c2410c", headText: "#fff", zebra: "#fff5ea", totalBg: "#c2410c", totalText: "#fff", grid: false },
  CLASSIC: { primary: "#1f2a44", accent: "#a06a2c", text: "#1b1b1b", muted: "#555b66", line: "#c9ccd3", headBg: "#1f2a44", headText: "#fff", zebra: "#f6f7f9", totalBg: "#1f2a44", totalText: "#fff", grid: true },
  ARTIQUE_SURFACE: { primary: "#9c3d1a", accent: "#c7702f", text: "#2a211b", muted: "#6b5b50", line: "#e4d6c8", headBg: "#9c3d1a", headText: "#fff", zebra: "#fbf5ee", totalBg: "#9c3d1a", totalText: "#fff", grid: false },
  MODERN_MINIMAL: { primary: "#111827", accent: "#0f766e", text: "#111827", muted: "#6b7280", line: "#d9dde3", headBg: "#fff", headText: "#111827", totalBg: "#111827", totalText: "#fff", grid: false },
  TFT_CLASSIC: { primary: "#7c2d12", accent: "#ea7a1c", text: "#231815", muted: "#665247", line: "#e6cdb8", headBg: "#7c2d12", headText: "#fff", zebra: "#fff7ef", totalBg: "#7c2d12", totalText: "#fff", grid: true },
  TFT_MINIMAL: { primary: "#1c1917", accent: "#c2410c", text: "#1c1917", muted: "#78716c", line: "#e7e0d8", headBg: "#fff", headText: "#1c1917", totalBg: "#c2410c", totalText: "#fff", grid: false },
  TFT_LUXURY: { dk: { title: "#ffd9b0", sub: "#d9a36b", text: "#e8cdb0" }, primary: "#231815", accent: "#ea7a1c", text: "#231815", muted: "#6b5548", line: "#f0d2b0", headBg: "#231815", headText: "#ffd9b0", zebra: "#fff6ec", totalBg: "#231815", totalText: "#ffd9b0", grid: false },
  LUXURY_TEXTURE: { dk: { title: "#e9cf94", sub: "#b8a37a", text: "#cfc4ad" }, primary: "#1c1a17", accent: "#b8893a", text: "#1c1a17", muted: "#5f5a52", line: "#dccfb6", headBg: "#1c1a17", headText: "#e9cf94", zebra: "#faf6ec", totalBg: "#1c1a17", totalText: "#e9cf94", grid: false },
};

const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number) => `₹ ${inr.format(n)}`;

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return (p.length > 1 ? p[0][0] + p[1][0] : name.slice(0, 2)).toUpperCase();
}

function Logo({ company, size, bg, color }: { company: CompanyProfile | null; size: number; bg: string; color: string }) {
  if (company?.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fileUrl(company.logoUrl)} alt="" style={{ height: size * 1.25, maxWidth: size * 2.4, objectFit: "contain" }} />;
  }
  return (
    <div style={{ width: size, height: size, background: bg, color, fontWeight: 700, fontSize: size * 0.34 }} className="flex items-center justify-center">
      {initials(company?.companyName || "Your Company")}
    </div>
  );
}

function ContactLines({ company, color, align }: { company: CompanyProfile | null; color: string; align?: "right" }) {
  const lines = [
    company?.address,
    [company?.phone, company?.email].filter(Boolean).join("  ·  "),
    company?.website,
    company?.gstNumber ? `GSTIN: ${company.gstNumber}` : "",
  ].filter(Boolean) as string[];
  const shown = lines.length ? lines : ["Address line, City · +91 00000 00000", "email@company.com · www.company.com"];
  return (
    <div style={{ color, fontSize: 11, lineHeight: 1.45, textAlign: align }}>
      {shown.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
}

function TitleBlock({ d, color, sub, size = 26 }: { d: SheetData; color: string; sub: string; size?: number }) {
  return (
    <div style={{ textAlign: "right", flexShrink: 0, whiteSpace: "nowrap" }}>
      <div style={{ color, fontSize: size, fontWeight: 700, letterSpacing: 3 }}>QUOTATION</div>
      <div style={{ color, fontSize: 14, fontWeight: 700 }}>{d.number}</div>
      <div style={{ color: sub, fontSize: 10.5, marginTop: 3 }}>
        Date: {d.date} · Valid until: {d.validUntil}
      </div>
    </div>
  );
}

function Label({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>{children}</div>
  );
}

function Header({ theme, d, company, p }: { theme: SheetTheme; d: SheetData; company: CompanyProfile | null; p: Palette }) {
  const name = company?.companyName || "Your Company Name";
  const tagline = company?.tagline || "Wall Textures · Surface Finishes · Wallpaper";

  const layout = LAYOUT[theme] ?? "classic";
  if (layout === "tft-band") {
    return (
      <div style={{ background: p.primary, borderBottom: `6px solid ${p.accent}`, padding: "48px 48px 34px", position: "relative", overflow: "hidden" }}>
        {[[150, 14, "#d95a1c"], [120, 8, "#e0702a"], [98, 4, "#ea8c45"]].map(([r, w, c]) => (
          <div key={String(r)} style={{ position: "absolute", top: 0, bottom: 0, right: Number(r) - Number(w) + 4, width: Number(w), background: String(c) }} />
        ))}
        <div className="relative flex items-start gap-5">
          <Logo company={company} size={68} bg="#ffe3c7" color={p.primary} />
          <div className="min-w-0 flex-1">
            <div style={{ color: "#fff", fontSize: 24, fontWeight: 800, letterSpacing: 2.5 }}>{name.toUpperCase()}</div>
            <div style={{ color: "#ffe3c7", fontSize: 11.5, marginBottom: 4 }}>{tagline}</div>
            <ContactLines company={company} color="#ffeedb" />
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, whiteSpace: "nowrap", marginTop: 10 }}>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: 3 }}>QUOTATION</div>
            <div style={{ color: "#ffe3c7", fontSize: 13, fontWeight: 700 }}>{d.number}</div>
          </div>
        </div>
      </div>
    );
  }
  if (layout === "band") {
    return (
      <div style={{ background: p.primary, borderBottom: `6px solid ${p.accent}`, padding: "48px 48px 34px" }}>
        <div className="flex items-start gap-5">
          <Logo company={company} size={68} bg={p.accent} color={p.primary} />
          <div className="min-w-0 flex-1">
            <div style={{ color: "#fff", fontSize: 21, fontWeight: 700 }}>{name}</div>
            <div style={{ color: "#f0d3b5", fontSize: 11, marginBottom: 4 }}>{tagline}</div>
            <ContactLines company={company} color="#f6e6d4" />
          </div>
          <TitleBlock d={d} color="#fff" sub="#f0d3b5" size={24} />
        </div>
      </div>
    );
  }
  if (layout === "luxury") {
    return (
      <div style={{ background: p.primary, borderBottom: `4px solid ${p.accent}`, padding: "48px 48px 34px" }}>
        <div className="flex items-start gap-5">
          <Logo company={company} size={68} bg={p.accent} color={p.primary} />
          <div className="min-w-0 flex-1">
            <div style={{ color: p.dk?.title ?? "#e9cf94", fontSize: 19, fontWeight: 700, letterSpacing: 2 }}>{name.toUpperCase()}</div>
            <div style={{ color: p.dk?.sub ?? "#b8a37a", fontSize: 11, marginBottom: 4 }}>{tagline}</div>
            <ContactLines company={company} color={p.dk?.text ?? "#cfc4ad"} />
          </div>
          <TitleBlock d={d} color={p.dk?.title ?? "#e9cf94"} sub={p.dk?.sub ?? "#b8a37a"} size={24} />
        </div>
      </div>
    );
  }
  if (layout === "minimal") {
    return (
      <div style={{ padding: "48px 48px 0" }}>
        <div className="flex items-start justify-between gap-5">
          <Logo company={company} size={58} bg={p.primary} color="#fff" />
          <div style={{ textAlign: "right" }}>
            <div style={{ color: p.text, fontSize: 16, fontWeight: 700 }}>{name}</div>
            <ContactLines company={company} color={p.muted} align="right" />
          </div>
        </div>
        <div style={{ color: p.text, fontSize: 42, fontWeight: 300, marginTop: 28, letterSpacing: -1 }}>Quotation</div>
        <div className="flex items-baseline gap-3" style={{ paddingBottom: 14, borderBottom: `1px solid ${p.line}` }}>
          <span style={{ color: p.accent, fontSize: 14, fontWeight: 700 }}>{d.number}</span>
          <span style={{ color: p.muted, fontSize: 11.5 }}>
            Issued {d.date} · Valid until {d.validUntil}
          </span>
        </div>
      </div>
    );
  }
  // Classic
  return (
    <div style={{ padding: "48px 48px 0" }}>
      <div className="flex items-start gap-5" style={{ paddingBottom: 12, borderBottom: `3px solid ${p.primary}` }}>
        <Logo company={company} size={68} bg={p.primary} color="#fff" />
        <div className="min-w-0 flex-1">
          <div style={{ color: p.primary, fontSize: 21, fontWeight: 700 }}>{name}</div>
          <div style={{ color: p.accent, fontSize: 11, fontStyle: "italic", marginBottom: 4 }}>{tagline}</div>
          <ContactLines company={company} color={p.muted} />
        </div>
        <TitleBlock d={d} color={p.primary} sub={p.muted} />
      </div>
    </div>
  );
}

export function QuotationSheet({
  theme,
  data = SAMPLE_SHEET,
  company,
}: {
  theme: SheetTheme;
  data?: SheetData;
  company: CompanyProfile | null;
}) {
  const p = PALETTES[theme] ?? PALETTES.TIME_FOR_TEXTURE;
  const d = data;
  const cell = { padding: "8px 8px", borderBottom: `1px solid ${p.line}` } as const;
  const gridBorder = p.grid ? `1px solid ${p.line}` : undefined;

  const totalRows: [string, string][] = [
    ["Sub Total", money(d.subTotal)],
    [d.discountLabel, `- ${money(d.discountAmount)}`],
    ...(d.gstLabel ? ([[d.gstLabel, money(d.gstAmount ?? 0)]] as [string, string][]) : []),
    ["Transportation", money(d.transportation)],
    ["Installation", money(d.installation)],
    ["Additional charges", money(d.additional)],
  ];

  return (
    <div
      style={{ width: SHEET_W, height: SHEET_H, background: "#fff", color: p.text, fontFamily: "Roboto, Inter, system-ui, sans-serif", fontSize: 12 }}
      className="relative overflow-hidden"
    >
      <Header theme={theme} d={d} company={company} p={p} />

      <div style={{ padding: "26px 48px 0" }}>
        <div className="flex gap-8">
          <div className="flex-1">
            <Label color={p.accent}>Quoted to</Label>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{d.customer.name}</div>
            {d.customer.company && <div style={{ color: p.muted }}>{d.customer.company}</div>}
            <div style={{ color: p.muted }}>{d.customer.address}</div>
            <div style={{ color: p.muted }}>Phone: {d.customer.phone}</div>
            {d.customer.email && <div style={{ color: p.muted }}>{d.customer.email}</div>}
          </div>
          <div style={{ width: 290 }}>
            <Label color={p.accent}>Project &amp; quotation</Label>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{d.projectName}</div>
            {[
              ["Quotation #", d.number],
              ["Date", d.date],
              ["Valid until", d.validUntil],
            ].map(([k, v]) => (
              <div key={k} className="flex" style={{ fontSize: 11.5, marginTop: 2 }}>
                <span style={{ color: p.muted, width: 92 }}>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24, fontSize: 11.5, border: gridBorder }}>
          <thead>
            <tr style={{ background: p.headBg, color: p.headText }}>
              {["#", "Product / Description", "Measurement", "Qty (sq.ft)", "Rate", "Amount"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "9px 8px",
                    fontSize: 10.5,
                    textAlign: i === 0 ? "center" : i >= 3 ? "right" : "left",
                    borderBottom: theme === "MODERN_MINIMAL" ? `2px solid ${p.primary}` : undefined,
                    borderRight: p.grid ? `1px solid ${p.line}` : undefined,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.items.map((it, i) => (
              <tr key={it.srNo} style={{ background: p.zebra && i % 2 === 1 ? p.zebra : undefined }}>
                <td style={{ ...cell, textAlign: "center", color: p.muted, borderRight: gridBorder }}>{it.srNo}</td>
                <td style={{ ...cell, borderRight: gridBorder }}>
                  <div style={{ fontWeight: 700 }}>{it.productName}</div>
                  {it.description && <div style={{ color: p.muted, fontSize: 10.5 }}>{it.description}</div>}
                </td>
                <td style={{ ...cell, color: p.muted, borderRight: gridBorder }}>{it.measurement || "—"}</td>
                <td style={{ ...cell, textAlign: "right", borderRight: gridBorder }}>{it.sqft}</td>
                <td style={{ ...cell, textAlign: "right", borderRight: gridBorder }}>{money(it.rate)}</td>
                <td style={{ ...cell, textAlign: "right", fontWeight: 700 }}>{money(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex gap-6">
          <div className="flex-1">
            <Label color={p.accent}>Amount in words</Label>
            <div style={{ fontStyle: "italic", fontSize: 11.5 }}>{d.words}</div>
          </div>
          <div style={{ width: 310 }}>
            {totalRows.map(([k, v]) => (
              <div key={k} className="flex justify-between" style={{ padding: "5px 8px", borderBottom: `1px solid ${p.line}`, fontSize: 11.5 }}>
                <span style={{ color: p.muted }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between" style={{ background: p.totalBg, color: p.totalText, padding: "9px 8px", fontWeight: 700 }}>
              <span style={{ fontSize: 13 }}>GRAND TOTAL</span>
              <span style={{ fontSize: 15 }}>{money(d.grandTotal)}</span>
            </div>
            {d.advance > 0 && (
              <div className="flex justify-between" style={{ padding: "6px 8px", color: p.primary, fontWeight: 700, fontSize: 11.5 }}>
                <span>Advance required</span>
                <span>{money(d.advance)}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 26 }}>
          <Label color={p.accent}>Terms &amp; conditions</Label>
          <ul style={{ color: p.muted, fontSize: 11, lineHeight: 1.5, paddingLeft: 16, listStyle: "disc" }}>
            {d.terms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {d.notes && (
            <div style={{ marginTop: 10 }}>
              <Label color={p.accent}>Notes</Label>
              <div style={{ color: p.muted, fontSize: 11 }}>{d.notes}</div>
            </div>
          )}
        </div>

        <div className="flex gap-10" style={{ marginTop: 56 }}>
          {[
            ["Authorised signatory", `For ${company?.companyName || "Your Company Name"}`],
            ["Customer acceptance", "Signature & date"],
          ].map(([a, b]) => (
            <div key={a} className="flex-1" style={{ borderTop: `1px solid ${p.line}`, paddingTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 11.5 }}>{a}</div>
              <div style={{ color: p.muted, fontSize: 10.5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{ position: "absolute", left: 48, right: 48, bottom: 30, borderTop: `1px solid ${p.line}`, paddingTop: 6, color: p.muted, fontSize: 10 }}
        className="flex justify-between"
      >
        <span>{[company?.companyName, company?.phone, company?.email].filter(Boolean).join("  ·  ") || "Your Company Name"}</span>
        <span>{d.number} · Page 1 of 1</span>
      </div>
    </div>
  );
}

/** Scales a fixed-size A4 sheet to whatever width its container has. */
export function ScaledSheet({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SHEET_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ width: "100%", height: SHEET_H * scale, position: "relative", overflow: "hidden" }}>
      <div style={{ width: SHEET_W, height: SHEET_H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        {children}
      </div>
    </div>
  );
}
