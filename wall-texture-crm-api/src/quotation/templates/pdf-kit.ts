import { QuotationPdfData } from './quotation-pdf.types';

/**
 * Shared building blocks for every quotation template. Each template supplies
 * a theme + its own header and composes these blocks, so all four designs
 * render the same data identically (Preview, Download, Print and WhatsApp all
 * use the exact same generated PDF).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PdfNode = any;

export interface PdfTheme {
  /** Main brand colour (headings, table header, rules). */
  primary: string;
  /** Secondary accent (gold, teal…). */
  accent: string;
  text: string;
  muted: string;
  line: string;
  tableHeadBg: string;
  tableHeadText: string;
  zebra?: string;
  totalBg: string;
  totalText: string;
  /** 'grid' = full borders, 'lines' = horizontal hairlines only. */
  tableStyle: 'grid' | 'lines';
}

const inr = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Indian-grouped rupee amount: ₹ 1,23,456.00 */
export function money(n: number): string {
  return `₹ ${inr.format(Number.isFinite(n) ? n : 0)}`;
}

export function qty(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtDate(d?: Date | string | null): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}
function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? ONES[h] + ' Hundred' : '', r ? twoDigits(r) : '']
    .filter(Boolean)
    .join(' ');
}

/** Indian-system amount in words, e.g. "Rupees One Lakh Twenty Three Thousand Only". */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  const parts = [
    crore ? twoDigits(crore % 100) + ' Crore' : '',
    lakh ? twoDigits(lakh) + ' Lakh' : '',
    thousand ? twoDigits(thousand) + ' Thousand' : '',
    rest ? threeDigits(rest) : '',
  ].filter(Boolean);

  let words = `Rupees ${parts.join(' ') || 'Zero'}`;
  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Only`;
}

/** Splits free-text terms/notes into clean lines, stripping any "1." / "-" / "•" prefix. */
export function toLines(text?: string | null): string[] {
  return (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

/** Logo image when one is uploaded, otherwise a neutral configurable placeholder square. */
export function logoBlock(
  data: QuotationPdfData,
  theme: PdfTheme,
  size = 54,
  onDark = false,
): PdfNode {
  if (data.company.logoPath) {
    // A real logo (usually with a wordmark) needs more room than the placeholder mark.
    return { image: data.company.logoPath, fit: [96, 84] };
  }
  return {
    table: {
      widths: [size],
      heights: [size],
      body: [
        [
          {
            text: initials(data.company.name),
            alignment: 'center',
            bold: true,
            fontSize: size * 0.34,
            color: onDark ? theme.primary : '#ffffff',
            fillColor: onDark ? theme.accent : theme.primary,
            margin: [0, size * 0.3, 0, 0],
            border: [false, false, false, false],
          },
        ],
      ],
    },
    layout: 'noBorders',
    width: size,
  };
}

export function companyContactLines(data: QuotationPdfData): string[] {
  const c = data.company;
  return [
    c.address,
    [c.phone, c.email].filter(Boolean).join('  ·  '),
    c.website,
    c.gstNumber ? `GSTIN: ${c.gstNumber}` : null,
  ].filter((l): l is string => !!l && l.trim().length > 0);
}

function customerAddress(data: QuotationPdfData): string[] {
  const cityLine = [data.city, data.state, data.pinCode].filter(Boolean).join(', ');
  return [data.address, cityLine].filter((l): l is string => !!l && l.trim().length > 0);
}

/** "Quoted to" + "Project / quotation details" side by side. */
export function partyBlock(data: QuotationPdfData, theme: PdfTheme): PdfNode {
  const label = (t: string): PdfNode => ({
    text: t.toUpperCase(),
    fontSize: 7.5,
    bold: true,
    characterSpacing: 1,
    color: theme.accent,
    margin: [0, 0, 0, 3],
  });
  const detailRow = (k: string, v: string): PdfNode => ({
    columns: [
      { text: k, width: 70, color: theme.muted, fontSize: 8.5 },
      { text: v, width: '*', fontSize: 8.5, bold: true },
    ],
    margin: [0, 1.5, 0, 0],
  });

  return {
    columns: [
      {
        width: '*',
        stack: [
          label('Quoted to'),
          { text: data.customerName, bold: true, fontSize: 11, color: theme.text },
          data.companyName
            ? { text: data.companyName, fontSize: 9, color: theme.muted }
            : null,
          ...customerAddress(data).map((l) => ({ text: l, fontSize: 9, color: theme.muted })),
          { text: `Phone: ${data.phone}`, fontSize: 9, color: theme.muted, margin: [0, 2, 0, 0] },
          data.email ? { text: data.email, fontSize: 9, color: theme.muted } : null,
          data.gstNumber
            ? { text: `GSTIN: ${data.gstNumber}`, fontSize: 9, color: theme.muted }
            : null,
        ].filter(Boolean),
      },
      { width: 24, text: '' },
      {
        width: 205,
        stack: [
          label('Project & quotation'),
          { text: data.projectName, bold: true, fontSize: 10.5, color: theme.text, margin: [0, 0, 0, 3] },
          detailRow('Quotation #', data.quotationNumber),
          detailRow('Date', fmtDate(data.quotationDate)),
          detailRow('Valid until', fmtDate(data.validUntil)),
          data.version > 1 ? detailRow('Revision', `v${data.version}`) : null,
        ].filter(Boolean),
      },
    ],
  };
}

const cell = (text: string, opts: Record<string, unknown> = {}): PdfNode => ({
  text,
  fontSize: 8.5,
  ...opts,
});

/** Items table: description wraps freely, header row repeats on every page, rows never split. */
export function itemsTable(data: QuotationPdfData, theme: PdfTheme): PdfNode {
  const head = ['#', 'Product / Description', 'Measurement', 'Qty (sq.ft)', 'Rate', 'Amount'].map(
    (t, i) => ({
      text: t,
      bold: true,
      fontSize: 8,
      color: theme.tableHeadText,
      fillColor: theme.tableHeadBg,
      alignment: i === 0 ? 'center' : i >= 3 ? 'right' : 'left',
      margin: [0, 2, 0, 2],
    }),
  );

  const rows = data.items.map((item) => [
    cell(String(item.srNo), { alignment: 'center', color: theme.muted }),
    {
      stack: [
        { text: item.productName, bold: true, fontSize: 9, color: theme.text },
        item.description
          ? { text: item.description, fontSize: 8, color: theme.muted, margin: [0, 1, 0, 0] }
          : null,
      ].filter(Boolean),
    },
    cell(item.measurement || '—', { color: theme.muted }),
    cell(qty(item.sqft), { alignment: 'right' }),
    cell(money(item.rate), { alignment: 'right' }),
    cell(money(item.amount), { alignment: 'right', bold: true }),
  ]);

  const grid = theme.tableStyle === 'grid';
  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      keepWithHeaderRows: 1,
      widths: [22, '*', 70, 52, 62, 74],
      body: [head, ...rows],
    },
    layout: {
      hLineWidth: (i: number, node: PdfNode) =>
        grid ? 0.6 : i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.4,
      vLineWidth: () => (grid ? 0.6 : 0),
      hLineColor: () => theme.line,
      vLineColor: () => theme.line,
      paddingTop: () => 5,
      paddingBottom: () => 5,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      fillColor: (i: number) => (i > 0 && theme.zebra && i % 2 === 0 ? theme.zebra : null),
    },
  };
}

/** Totals ladder + amount in words. Every charge from the quotation is shown, none dropped. */
export function totalsBlock(data: QuotationPdfData, theme: PdfTheme): PdfNode {
  const rows: [string, string, boolean?][] = [
    ['Sub Total', money(data.subTotal)],
    [
      `Discount${data.discountType === 'PERCENTAGE' ? ` (${data.discountValue}%)` : ' (Flat)'}`,
      `- ${money(data.discountAmount)}`,
    ],
  ];
  if (data.gstEnabled) rows.push([`GST (${data.gstPercentage}%)`, money(data.gstAmount)]);
  rows.push(
    ['Transportation', money(data.transportationCharges)],
    ['Installation', money(data.installationCharges)],
    ['Additional charges', money(data.additionalCharges)],
  );

  const body: PdfNode[][] = rows.map(([k, v]) => [
    { text: k, fontSize: 9, color: theme.muted, border: [false, false, false, true] },
    { text: v, fontSize: 9, alignment: 'right', border: [false, false, false, true] },
  ]);
  body.push([
    {
      text: 'GRAND TOTAL',
      bold: true,
      fontSize: 10,
      color: theme.totalText,
      fillColor: theme.totalBg,
      border: [false, false, false, false],
      margin: [0, 3, 0, 3],
    },
    {
      text: money(data.grandTotal),
      bold: true,
      fontSize: 11,
      alignment: 'right',
      color: theme.totalText,
      fillColor: theme.totalBg,
      border: [false, false, false, false],
      margin: [0, 3, 0, 3],
    },
  ]);
  if (data.advanceRequired > 0) {
    body.push([
      { text: 'Advance required', fontSize: 9, bold: true, color: theme.primary, border: [false, false, false, false] },
      { text: money(data.advanceRequired), fontSize: 9, bold: true, alignment: 'right', color: theme.primary, border: [false, false, false, false] },
    ]);
  }

  return {
    unbreakable: true,
    columns: [
      {
        width: '*',
        stack: [
          { text: 'AMOUNT IN WORDS', fontSize: 7.5, bold: true, characterSpacing: 1, color: theme.accent },
          { text: amountInWords(data.grandTotal), fontSize: 9, italics: true, color: theme.text, margin: [0, 2, 12, 0] },
        ],
      },
      {
        width: 232,
        table: { widths: ['*', 96], body },
        layout: {
          hLineColor: () => theme.line,
          hLineWidth: () => 0.4,
          vLineWidth: () => 0,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 3.5,
          paddingBottom: () => 3.5,
        },
      },
    ],
    margin: [0, 10, 0, 0],
  };
}

/** Terms as a bullet list + notes paragraph; renders nothing if both are empty. */
export function termsNotesBlock(data: QuotationPdfData, theme: PdfTheme): PdfNode {
  const terms = toLines(data.termsConditions);
  const notes = (data.notes ?? '').trim();
  if (!terms.length && !notes) return { text: '' };

  const heading = (t: string): PdfNode => ({
    text: t.toUpperCase(),
    fontSize: 7.5,
    bold: true,
    characterSpacing: 1,
    color: theme.accent,
    margin: [0, 0, 0, 3],
  });

  return {
    margin: [0, 16, 0, 0],
    stack: [
      terms.length
        ? {
            stack: [
              heading('Terms & conditions'),
              { ul: terms, fontSize: 8.5, color: theme.muted, markerColor: theme.accent, lineHeight: 1.25 },
            ],
            margin: [0, 0, 0, notes ? 10 : 0],
          }
        : null,
      notes
        ? {
            stack: [heading('Notes'), { text: notes, fontSize: 8.5, color: theme.muted, lineHeight: 1.25 }],
          }
        : null,
    ].filter(Boolean),
  };
}

export function signatureBlock(data: QuotationPdfData, theme: PdfTheme): PdfNode {
  const sig = (label: string, sub?: string): PdfNode => ({
    width: '*',
    stack: [
      { text: '', margin: [0, 34, 0, 0] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 190, y2: 0, lineWidth: 0.6, lineColor: theme.line }] },
      { text: label, fontSize: 8.5, bold: true, margin: [0, 3, 0, 0], color: theme.text },
      sub ? { text: sub, fontSize: 8, color: theme.muted } : null,
    ].filter(Boolean),
  });
  return {
    unbreakable: true,
    margin: [0, 22, 0, 0],
    columns: [sig('Authorised signatory', `For ${data.company.name}`), sig('Customer acceptance', 'Signature & date')],
    columnGap: 40,
  };
}

/** Footer: company contact left, page x of y right. Keeps long documents tidy across pages. */
export function pageFooter(data: QuotationPdfData, theme: PdfTheme) {
  const contact = [data.company.name, data.company.phone, data.company.email, data.company.website]
    .filter(Boolean)
    .join('  ·  ');
  return (currentPage: number, pageCount: number): PdfNode => ({
    margin: [36, 14, 36, 0],
    stack: [
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 0.4, lineColor: theme.line }] },
      {
        columns: [
          { text: contact, fontSize: 7.5, color: theme.muted, margin: [0, 4, 0, 0] },
          {
            text: `${data.quotationNumber}  ·  Page ${currentPage} of ${pageCount}`,
            fontSize: 7.5,
            color: theme.muted,
            alignment: 'right',
            margin: [0, 4, 0, 0],
          },
        ],
      },
    ],
  });
}

/** Standard page setup shared by all templates. */
export const PAGE = {
  pageSize: 'A4',
  pageMargins: [36, 36, 36, 56] as [number, number, number, number],
  defaultStyle: { font: 'Roboto', fontSize: 9 },
};

/** Assembles the shared document body around a template-specific header/background. */
export function composeQuotation(
  data: QuotationPdfData,
  theme: PdfTheme,
  opts: {
    header: PdfNode;
    background?: PdfNode;
    /** Vertical gap between the header and the party block. */
    headerGap?: number;
  },
): Record<string, unknown> {
  return {
    ...PAGE,
    info: {
      title: `Quotation ${data.quotationNumber}`,
      author: data.company.name,
      subject: data.projectName,
    },
    background: opts.background,
    footer: pageFooter(data, theme),
    content: [
      opts.header,
      { text: '', margin: [0, opts.headerGap ?? 18, 0, 0] },
      partyBlock(data, theme),
      { text: '', margin: [0, 16, 0, 0] },
      itemsTable(data, theme),
      totalsBlock(data, theme),
      termsNotesBlock(data, theme),
      signatureBlock(data, theme),
    ],
  };
}
