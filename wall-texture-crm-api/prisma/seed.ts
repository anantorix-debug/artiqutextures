import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const GALLERY_CATEGORIES = [
  'Wall Texture',
  'Decorative Finish',
  'Artique Surface',
  'Wallpaper',
  'Wood Finish',
  'Marble Finish',
  'Metal Finish',
  'Residential',
  'Commercial',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  // ---------------------------------------------------------------------
  // Admin user
  // ---------------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@walltextures.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';

  const existingAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 10),
        isActive: true,
      },
    });
    console.log(`Created admin user: ${adminEmail} / ${adminPassword} (change this after first login)`);
  } else {
    console.log('Admin user already exists — skipping');
  }

  // ---------------------------------------------------------------------
  // Quotation templates
  // ---------------------------------------------------------------------
  await prisma.quotationTemplate.upsert({
    where: { code: 'TIME_FOR_TEXTURE' },
    update: {},
    create: {
      name: 'Time For Texture',
      code: 'TIME_FOR_TEXTURE',
      description: 'Warm, terracotta-accented quotation layout for Time For Texture.',
      isActive: true,
      isDefault: true,
    },
  });

  await prisma.quotationTemplate.upsert({
    where: { code: 'ARTIQUE_SURFACE' },
    update: {},
    create: {
      name: 'Artique Surface',
      code: 'ARTIQUE_SURFACE',
      description: 'Premium dark & gold quotation layout for Artique Surface.',
      isActive: true,
      isDefault: false,
    },
  });
  console.log('Quotation templates seeded');

  // ---------------------------------------------------------------------
  // Gallery categories
  // ---------------------------------------------------------------------
  for (const [index, name] of GALLERY_CATEGORIES.entries()) {
    const slug = slugify(name);
    await prisma.galleryCategory.upsert({
      where: { slug },
      update: {},
      create: { name, slug, sortOrder: index, isActive: true },
    });
  }
  console.log(`Gallery categories seeded (${GALLERY_CATEGORIES.length})`);

  // ---------------------------------------------------------------------
  // Default settings placeholders (General)
  // ---------------------------------------------------------------------
  const generalDefaults: Array<{ key: string; value: string }> = [
    { key: 'timezone', value: 'Asia/Kolkata' },
    { key: 'dateFormat', value: 'DD/MM/YYYY' },
    { key: 'currency', value: 'INR' },
    { key: 'defaultPageSize', value: '10' },
  ];
  for (const setting of generalDefaults) {
    await prisma.setting.upsert({
      where: { category_key: { category: 'GENERAL', key: setting.key } },
      update: {},
      create: { category: 'GENERAL', key: setting.key, value: setting.value },
    });
  }
  console.log('General settings defaults seeded');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
