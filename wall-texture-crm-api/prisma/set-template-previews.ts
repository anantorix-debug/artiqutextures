/**
 * One-off script: generates a sample preview thumbnail for each quotation
 * template (styled with that template's actual brand colors) and sets
 * QuotationTemplate.previewImageUrl. Safe to re-run — overwrites the file
 * and DB value each time.
 */
import { PrismaClient, QuotationTemplateCode } from '@prisma/client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { deflateSync } from 'zlib';

const prisma = new PrismaClient();

function crc32(buf: Buffer): number {
  let c: number;
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

type Rgb = [number, number, number];

/** A simple two-band "quotation card" thumbnail: header band + body band + a few "line" stripes. */
function previewPng(width: number, height: number, headerColor: Rgb, bodyColor: Rgb, lineColor: Rgb): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  const ihdr = pngChunk('IHDR', ihdrData);

  const headerHeight = Math.round(height * 0.22);
  const rowLength = width * 3;
  const raw = Buffer.alloc((rowLength + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowLength + 1);
    raw[rowStart] = 0;
    const inHeader = y < headerHeight;
    // A few horizontal "text line" stripes in the body to suggest a quotation table.
    const isLineStripe =
      !inHeader && [0.35, 0.45, 0.55, 0.65, 0.78].some((f) => Math.abs(y - height * f) < height * 0.015);

    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      const [r, g, b] = inHeader ? headerColor : isLineStripe && x > width * 0.06 && x < width * 0.94 ? lineColor : bodyColor;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const idat = pngChunk('IDAT', deflateSync(raw));
  const iend = pngChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

async function main() {
  const dir = join(process.cwd(), 'uploads', 'templates');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const samples: Array<{ code: QuotationTemplateCode; header: Rgb; body: Rgb; line: Rgb; file: string }> = [
    {
      code: QuotationTemplateCode.TIME_FOR_TEXTURE,
      header: [194, 65, 12], // terracotta, matches the PDF template's ACCENT
      body: [255, 247, 237], // ACCENT_LIGHT
      line: [254, 215, 170],
      file: 'time-for-texture-preview.png',
    },
    {
      code: QuotationTemplateCode.ARTIQUE_SURFACE,
      header: [28, 25, 23], // near-black INK, matches the PDF template
      body: [254, 252, 232], // GOLD_LIGHT
      line: [161, 98, 7], // GOLD
      file: 'artique-surface-preview.png',
    },
  ];

  for (const sample of samples) {
    const buffer = previewPng(400, 520, sample.header, sample.body, sample.line);
    writeFileSync(join(dir, sample.file), buffer);
    const previewImageUrl = `/uploads/templates/${sample.file}`;

    await prisma.quotationTemplate.updateMany({
      where: { code: sample.code },
      data: { previewImageUrl },
    });
    console.log(`Set preview for ${sample.code} -> ${previewImageUrl}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
