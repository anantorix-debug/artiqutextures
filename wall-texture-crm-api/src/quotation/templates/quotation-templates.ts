import { QuotationTemplateCode } from '@prisma/client';
import { QuotationPdfData } from './quotation-pdf.types';
import {
  PdfNode,
  PdfTheme,
  companyContactLines,
  composeQuotation,
  fmtDate,
  logoBlock,
} from './pdf-kit';

const PAGE_W = 595.28;

type Builder = (data: QuotationPdfData) => Record<string, unknown>;

/** Two brands, four layouts each. Time For Texture is a separate company with its own details/logo. */
export type Brand = 'ARTIQU' | 'TFT';

export const BRAND_OF: Record<QuotationTemplateCode, Brand> = {
  ARTIQUE_SURFACE: 'ARTIQU',
  CLASSIC: 'ARTIQU',
  MODERN_MINIMAL: 'ARTIQU',
  LUXURY_TEXTURE: 'ARTIQU',
  TIME_FOR_TEXTURE: 'TFT',
  TFT_CLASSIC: 'TFT',
  TFT_MINIMAL: 'TFT',
  TFT_LUXURY: 'TFT',
};

export const isSecondBrand = (code: QuotationTemplateCode) =>
  BRAND_OF[code] === 'TFT';

/** Theme + the light-on-dark colours used by the banded layouts. */
interface Look extends PdfTheme {
  onDark: string;
  onDarkSub: string;
  onDarkText: string;
}

const contact = (data: QuotationPdfData, color: string, align?: string): PdfNode[] =>
  companyContactLines(data).map((l) => ({
    text: l,
    fontSize: 8,
    color,
    alignment: align,
    lineHeight: 1.2,
  }));

/** Right-aligned "QUOTATION / number / date" block. */
const titleBlock = (
  data: QuotationPdfData,
  opts: { color: string; sub: string; size?: number; spacing?: number },
): PdfNode => ({
  width: 170,
  stack: [
    {
      text: 'QUOTATION',
      fontSize: opts.size ?? 22,
      bold: true,
      alignment: 'right',
      color: opts.color,
      characterSpacing: opts.spacing ?? 2,
    },
    { text: data.quotationNumber, fontSize: 10, bold: true, alignment: 'right', color: opts.color },
    {
      text: `Date: ${fmtDate(data.quotationDate)}   ·   Valid until: ${fmtDate(data.validUntil)}`,
      fontSize: 7.5,
      alignment: 'right',
      color: opts.sub,
      margin: [0, 2, 0, 0],
    },
  ],
});

// ---------------------------------------------------------------------------
// Layout 1 — Classic: letterhead on white, ruled table
// ---------------------------------------------------------------------------
const classic =
  (t: Look): Builder =>
  (data) =>
    composeQuotation(data, t, {
      header: {
        stack: [
          {
            columns: [
              { width: 130, ...logoBlock(data, t, 52) },
              {
                width: '*',
                stack: [
                  { text: data.company.name, fontSize: 15, bold: true, color: t.primary },
                  data.company.tagline
                    ? { text: data.company.tagline, fontSize: 8, italics: true, color: t.accent, margin: [0, 0, 0, 2] }
                    : null,
                  ...contact(data, t.muted),
                ].filter(Boolean),
              },
              titleBlock(data, { color: t.primary, sub: t.muted }),
            ],
            columnGap: 10,
          },
          { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 523, y2: 8, lineWidth: 2, lineColor: t.primary }] },
        ],
      },
    });

// ---------------------------------------------------------------------------
// Layout 2 — Band: full-bleed coloured header band with stripe accents
// ---------------------------------------------------------------------------
const band =
  (t: Look, opts: { wordmark?: boolean } = {}): Builder =>
  (data) =>
    composeQuotation(data, t, {
      headerGap: 44,
      background: {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: PAGE_W, h: 134, color: t.primary },
          { type: 'rect', x: 0, y: 134, w: PAGE_W, h: 5, color: t.accent },
          { type: 'rect', x: 0, y: 139, w: PAGE_W, h: 2, color: '#e6c9a8' },
          ...(opts.wordmark
            ? [
                { type: 'rect', x: PAGE_W - 150, y: 0, w: 14, h: 134, color: '#d95a1c' },
                { type: 'rect', x: PAGE_W - 120, y: 0, w: 8, h: 134, color: '#e0702a' },
                { type: 'rect', x: PAGE_W - 98, y: 0, w: 4, h: 134, color: '#ea8c45' },
              ]
            : []),
        ],
      },
      header: {
        columns: [
          { width: 130, ...logoBlock(data, t, 52, true) },
          {
            width: '*',
            stack: [
              opts.wordmark
                ? { text: data.company.name.toUpperCase(), fontSize: 19, bold: true, color: '#ffffff', characterSpacing: 2 }
                : { text: data.company.name, fontSize: 16, bold: true, color: '#ffffff' },
              data.company.tagline
                ? { text: data.company.tagline, fontSize: 8, color: t.onDarkSub, margin: [0, 1, 0, 3] }
                : null,
              ...contact(data, t.onDarkText),
            ].filter(Boolean),
          },
          opts.wordmark
            ? {
                width: 150,
                stack: [
                  { text: 'QUOTATION', fontSize: 15, bold: true, alignment: 'right', color: '#ffffff', characterSpacing: 3, margin: [0, 26, 0, 0] },
                  { text: data.quotationNumber, fontSize: 10, bold: true, alignment: 'right', color: t.onDarkSub },
                ],
              }
            : titleBlock(data, { color: '#ffffff', sub: t.onDarkSub, size: 20 }),
        ],
        columnGap: 10,
      },
    });

// ---------------------------------------------------------------------------
// Layout 3 — Minimal: white space, hairlines
// ---------------------------------------------------------------------------
const minimal =
  (t: Look): Builder =>
  (data) =>
    composeQuotation(data, t, {
      header: {
        stack: [
          {
            columns: [
              { width: 130, ...logoBlock(data, t, 46) },
              { width: '*', text: '' },
              {
                width: 260,
                stack: [
                  { text: data.company.name, fontSize: 12, bold: true, alignment: 'right', color: t.text },
                  ...contact(data, t.muted, 'right'),
                ],
              },
            ],
          },
          { text: 'Quotation', fontSize: 30, color: t.text, margin: [0, 22, 0, 0], characterSpacing: -0.5 },
          {
            columns: [
              { text: data.quotationNumber, fontSize: 10, bold: true, color: t.accent, width: 'auto' },
              {
                text: `Issued ${fmtDate(data.quotationDate)}  ·  Valid until ${fmtDate(data.validUntil)}`,
                fontSize: 8.5,
                color: t.muted,
                margin: [10, 1.5, 0, 0],
              },
            ],
          },
          { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 523, y2: 10, lineWidth: 0.6, lineColor: t.line }] },
        ],
      },
    });

// ---------------------------------------------------------------------------
// Layout 4 — Luxury: dark band, spaced capitals, thin accent rules
// ---------------------------------------------------------------------------
const luxury =
  (t: Look): Builder =>
  (data) =>
    composeQuotation(data, t, {
      headerGap: 44,
      background: {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: PAGE_W, h: 134, color: t.primary },
          { type: 'rect', x: 36, y: 128, w: PAGE_W - 72, h: 1, color: t.accent },
          { type: 'rect', x: 0, y: 134, w: PAGE_W, h: 3, color: t.accent },
        ],
      },
      header: {
        columns: [
          { width: 130, ...logoBlock(data, t, 52, true) },
          {
            width: '*',
            stack: [
              { text: data.company.name.toUpperCase(), fontSize: 14, bold: true, color: t.tableHeadText, characterSpacing: 1.5 },
              data.company.tagline
                ? { text: data.company.tagline, fontSize: 8, color: t.onDarkSub, margin: [0, 0, 0, 3] }
                : null,
              ...contact(data, t.onDarkText),
            ].filter(Boolean),
          },
          titleBlock(data, { color: t.tableHeadText, sub: t.onDarkSub, size: 20, spacing: 4 }),
        ],
        columnGap: 10,
      },
    });

// ---------------------------------------------------------------------------
// Looks (colour palettes) per brand
// ---------------------------------------------------------------------------
const A_CLASSIC: Look = {
  primary: '#1f2a44', accent: '#a06a2c', text: '#1b1b1b', muted: '#555b66', line: '#c9ccd3',
  tableHeadBg: '#1f2a44', tableHeadText: '#ffffff', zebra: '#f6f7f9', totalBg: '#1f2a44', totalText: '#ffffff',
  tableStyle: 'grid', onDark: '#ffffff', onDarkSub: '#ccd0dd', onDarkText: '#eef0f6',
};
const A_BAND: Look = {
  primary: '#9c3d1a', accent: '#c7702f', text: '#2a211b', muted: '#6b5b50', line: '#e4d6c8',
  tableHeadBg: '#9c3d1a', tableHeadText: '#ffffff', zebra: '#fbf5ee', totalBg: '#9c3d1a', totalText: '#ffffff',
  tableStyle: 'lines', onDark: '#ffffff', onDarkSub: '#f0d3b5', onDarkText: '#f6e6d4',
};
const A_MINIMAL: Look = {
  primary: '#111827', accent: '#0f766e', text: '#111827', muted: '#6b7280', line: '#d9dde3',
  tableHeadBg: '#ffffff', tableHeadText: '#111827', totalBg: '#111827', totalText: '#ffffff',
  tableStyle: 'lines', onDark: '#ffffff', onDarkSub: '#cccccc', onDarkText: '#eeeeee',
};
const A_LUXURY: Look = {
  primary: '#1c1a17', accent: '#b8893a', text: '#1c1a17', muted: '#5f5a52', line: '#dccfb6',
  tableHeadBg: '#1c1a17', tableHeadText: '#e9cf94', zebra: '#faf6ec', totalBg: '#1c1a17', totalText: '#e9cf94',
  tableStyle: 'lines', onDark: '#e9cf94', onDarkSub: '#b8a37a', onDarkText: '#cfc4ad',
};

const T_BAND: Look = {
  primary: '#c2410c', accent: '#ea7a1c', text: '#2b1d14', muted: '#6f5a4a', line: '#f1d5b8',
  tableHeadBg: '#c2410c', tableHeadText: '#ffffff', zebra: '#fff5ea', totalBg: '#c2410c', totalText: '#ffffff',
  tableStyle: 'lines', onDark: '#ffffff', onDarkSub: '#ffe3c7', onDarkText: '#ffeedb',
};
const T_CLASSIC: Look = {
  primary: '#7c2d12', accent: '#ea7a1c', text: '#231815', muted: '#665247', line: '#e6cdb8',
  tableHeadBg: '#7c2d12', tableHeadText: '#ffffff', zebra: '#fff7ef', totalBg: '#7c2d12', totalText: '#ffffff',
  tableStyle: 'grid', onDark: '#ffffff', onDarkSub: '#ffe3c7', onDarkText: '#ffeedb',
};
const T_MINIMAL: Look = {
  primary: '#1c1917', accent: '#c2410c', text: '#1c1917', muted: '#78716c', line: '#e7e0d8',
  tableHeadBg: '#ffffff', tableHeadText: '#1c1917', totalBg: '#c2410c', totalText: '#ffffff',
  tableStyle: 'lines', onDark: '#ffffff', onDarkSub: '#cccccc', onDarkText: '#eeeeee',
};
const T_LUXURY: Look = {
  primary: '#231815', accent: '#ea7a1c', text: '#231815', muted: '#6b5548', line: '#f0d2b0',
  tableHeadBg: '#231815', tableHeadText: '#ffd9b0', zebra: '#fff6ec', totalBg: '#231815', totalText: '#ffd9b0',
  tableStyle: 'lines', onDark: '#ffd9b0', onDarkSub: '#d9a36b', onDarkText: '#e8cdb0',
};

export const TEMPLATE_BUILDERS: Record<QuotationTemplateCode, Builder> = {
  // Artiqu Surface
  ARTIQUE_SURFACE: band(A_BAND),
  CLASSIC: classic(A_CLASSIC),
  MODERN_MINIMAL: minimal(A_MINIMAL),
  LUXURY_TEXTURE: luxury(A_LUXURY),
  // Time For Texture (separate brand)
  TIME_FOR_TEXTURE: band(T_BAND, { wordmark: true }),
  TFT_CLASSIC: classic(T_CLASSIC),
  TFT_MINIMAL: minimal(T_MINIMAL),
  TFT_LUXURY: luxury(T_LUXURY),
};

/** Display metadata — used to seed/refresh the quotation_templates table. */
export const TEMPLATE_META: Record<
  QuotationTemplateCode,
  { name: string; description: string }
> = {
  ARTIQUE_SURFACE: {
    name: 'Artique Surface',
    description: 'Warm terracotta header band, made for texture & facade work.',
  },
  CLASSIC: {
    name: 'Classic',
    description: 'Formal navy letterhead with a fully ruled item table.',
  },
  MODERN_MINIMAL: {
    name: 'Modern Minimal',
    description: 'Clean white layout, hairline rules and generous spacing.',
  },
  LUXURY_TEXTURE: {
    name: 'Luxury Texture',
    description: 'Charcoal and antique-gold premium layout for high-end finishes.',
  },
  TIME_FOR_TEXTURE: {
    name: 'Time For Texture',
    description: 'Bold burnt-orange band with the Time For Texture wordmark.',
  },
  TFT_CLASSIC: {
    name: 'Time For Texture - Classic',
    description: 'Rust letterhead on white with a fully ruled item table.',
  },
  TFT_MINIMAL: {
    name: 'Time For Texture - Minimal',
    description: 'Clean white layout with an orange accent and hairline rules.',
  },
  TFT_LUXURY: {
    name: 'Time For Texture - Premium',
    description: 'Dark espresso header with warm copper accents.',
  },
};
