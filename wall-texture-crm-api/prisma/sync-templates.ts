/**
 * Idempotent: makes sure the four quotation templates and the gallery filter
 * categories exist and carry current names/descriptions. Never deletes anything.
 *   npm run prisma:sync-templates
 */
import { PrismaClient, QuotationTemplateCode } from '@prisma/client';
import { TEMPLATE_META } from '../src/quotation/templates/quotation-templates';

const prisma = new PrismaClient();

const ORDER: QuotationTemplateCode[] = [
  'ARTIQUE_SURFACE',
  'CLASSIC',
  'MODERN_MINIMAL',
  'LUXURY_TEXTURE',
  'TIME_FOR_TEXTURE',
  'TFT_CLASSIC',
  'TFT_MINIMAL',
  'TFT_LUXURY',
];

const GALLERY_CATEGORIES = [
  'Residential',
  'Commercial',
  'Interior',
  'Exterior',
  'Texture',
  'Wallpaper',
  'Metallic',
  'Completed Projects',
];

const slugify = (t: string) =>
  t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function main() {
  const hasDefault = await prisma.quotationTemplate.count({
    where: { isDefault: true, deletedAt: null },
  });

  for (const [i, code] of ORDER.entries()) {
    const meta = TEMPLATE_META[code];
    await prisma.quotationTemplate.upsert({
      where: { code },
      update: {
        name: meta.name,
        description: meta.description,
        isActive: true,
        deletedAt: null,
        createdAt: new Date(Date.now() + i * 1000),
      },
      create: {
        code,
        name: meta.name,
        description: meta.description,
        isActive: true,
        isDefault: !hasDefault && code === 'ARTIQUE_SURFACE',
        // Keeps creation order == display order for the picker.
        createdAt: new Date(Date.now() + i * 1000),
      },
    });
  }
  console.log('Quotation templates synced');

  const base = await prisma.galleryCategory.count();
  for (const [i, name] of GALLERY_CATEGORIES.entries()) {
    const slug = slugify(name);
    await prisma.galleryCategory.upsert({
      where: { slug },
      update: {},
      create: { name, slug, sortOrder: base + i, isActive: true },
    });
  }
  console.log('Gallery categories ensured');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
