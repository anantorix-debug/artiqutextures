import { Injectable } from '@nestjs/common';
import { join, dirname } from 'path';
// pdfmake ships no type declarations for its server build — typed loosely here.

const pdfMake = require('pdfmake');

export type PdfDocDefinition = Record<string, unknown>;

const fontsRoot = join(
  dirname(require.resolve('pdfmake/package.json')),
  'fonts',
  'Roboto',
);

/**
 * Thin, reusable wrapper around pdfmake for server-side PDF generation.
 * Any module (quotations, reports, exports) can inject this instead of
 * re-configuring fonts/access policies on its own.
 */
@Injectable()
export class PdfService {
  constructor() {
    pdfMake.setFonts({
      Roboto: {
        normal: join(fontsRoot, 'Roboto-Regular.ttf'),
        bold: join(fontsRoot, 'Roboto-Medium.ttf'),
        italics: join(fontsRoot, 'Roboto-Italic.ttf'),
        bolditalics: join(fontsRoot, 'Roboto-MediumItalic.ttf'),
      },
    });
    pdfMake.setLocalAccessPolicy(() => true);
  }

  async generateBuffer(docDefinition: PdfDocDefinition): Promise<Buffer> {
    const doc = pdfMake.createPdf({
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      ...docDefinition,
    });
    return doc.getBuffer();
  }
}
