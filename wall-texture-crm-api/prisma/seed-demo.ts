/**
 * Realistic demo/test data on top of the baseline seed (admin user, quotation
 * templates, gallery categories). Safe to re-run — it always creates fresh
 * rows rather than upserting, so run this once on a freshly migrated DB
 * (or clear the transactional tables first if you want a clean re-seed).
 */
import { PrismaClient, LeadPriority, LeadSource, LeadStatus, ProjectStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { deflateSync } from 'zlib';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------
// Tiny dependency-free PNG generator — produces a solid-color square so
// gallery/project images resolve to a real, valid image file on disk
// instead of a broken <img> link.
// ---------------------------------------------------------------------
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

function solidColorPng(width: number, height: number, [r, g, b]: [number, number, number]): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = pngChunk('IHDR', ihdrData);

  const rowLength = width * 3;
  const raw = Buffer.alloc((rowLength + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowLength + 1);
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const idat = pngChunk('IDAT', deflateSync(raw));
  const iend = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function writePlaceholderImage(subfolder: string, color: [number, number, number]): string {
  const dir = join(process.cwd(), 'uploads', subfolder);
  ensureDir(dir);
  const filename = `${Date.now()}-${randomUUID()}.png`;
  writeFileSync(join(dir, filename), solidColorPng(640, 480, color));
  return `/uploads/${subfolder}/${filename}`;
}

// ---------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------
const CITIES = [
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Vadodara', state: 'Gujarat' },
  { city: 'Rajkot', state: 'Gujarat' },
];

const LEADS: Array<{
  customerName: string;
  companyName?: string;
  requirement: string;
  leadSource: LeadSource;
  priority: LeadPriority;
  status: LeadStatus;
  daysFollowUp: number; // negative = overdue, 0 = today, positive = future
  daysSiteVisit?: number;
}> = [
  { customerName: 'Rajesh Kumar', requirement: '3D wall texture for living room, ~500 sq.ft', leadSource: LeadSource.WEBSITE, priority: LeadPriority.HIGH, status: LeadStatus.NEW, daysFollowUp: 1 },
  { customerName: 'Priya Sharma', companyName: 'Sharma Interiors', requirement: 'Decorative finish for master bedroom accent wall', leadSource: LeadSource.REFERRAL, priority: LeadPriority.MEDIUM, status: LeadStatus.CONTACTED, daysFollowUp: -1 },
  { customerName: 'Amit Patel', companyName: 'Patel Constructions', requirement: 'Exterior texture coating for a 4BHK villa', leadSource: LeadSource.EXHIBITION, priority: LeadPriority.URGENT, status: LeadStatus.SITE_VISIT_SCHEDULED, daysFollowUp: 0, daysSiteVisit: 3 },
  { customerName: 'Sneha Reddy', requirement: 'Marble finish for hotel lobby, 1200 sq.ft', leadSource: LeadSource.SOCIAL_MEDIA, priority: LeadPriority.HIGH, status: LeadStatus.SITE_VISIT_DONE, daysFollowUp: 2, daysSiteVisit: -2 },
  { customerName: 'Vikram Singh', companyName: 'Singh Developers', requirement: 'Wood finish paneling for office reception', leadSource: LeadSource.PHONE_CALL, priority: LeadPriority.MEDIUM, status: LeadStatus.QUOTATION_SENT, daysFollowUp: 3 },
  { customerName: 'Anjali Mehta', requirement: 'Wallpaper + texture combo for kids room', leadSource: LeadSource.WEBSITE, priority: LeadPriority.LOW, status: LeadStatus.NEGOTIATION, daysFollowUp: 1 },
  { customerName: 'Karan Desai', companyName: 'Desai Retail Pvt Ltd', requirement: 'Metal finish accent panels for showroom', leadSource: LeadSource.ADVERTISEMENT, priority: LeadPriority.HIGH, status: LeadStatus.WON, daysFollowUp: 10 },
  { customerName: 'Neha Joshi', requirement: 'Artique surface finish for dining area', leadSource: LeadSource.REFERRAL, priority: LeadPriority.MEDIUM, status: LeadStatus.WON, daysFollowUp: 14 },
  { customerName: 'Rohit Verma', requirement: 'Budget texture work for 2BHK flat', leadSource: LeadSource.WALK_IN, priority: LeadPriority.LOW, status: LeadStatus.LOST, daysFollowUp: 20 },
  { customerName: 'Divya Nair', companyName: 'Nair Hospitality', requirement: 'Resort villa exterior decorative finish', leadSource: LeadSource.EXHIBITION, priority: LeadPriority.URGENT, status: LeadStatus.ON_HOLD, daysFollowUp: 5 },
  { customerName: 'Suresh Iyer', requirement: 'Living + dining wall texture, modern theme', leadSource: LeadSource.WEBSITE, priority: LeadPriority.MEDIUM, status: LeadStatus.NEW, daysFollowUp: -2 },
  { customerName: 'Pooja Agarwal', companyName: 'Agarwal Builders', requirement: 'Commercial complex facade texture', leadSource: LeadSource.OTHER, priority: LeadPriority.HIGH, status: LeadStatus.CONTACTED, daysFollowUp: 0 },
];

const TEXTURE_PRODUCTS = [
  { name: 'PU Wall Texture - Sandstone Finish', rate: 85 },
  { name: 'Artique Surface - Limestone Effect', rate: 145 },
  { name: 'Decorative Marble Finish', rate: 220 },
  { name: 'Wood Grain Panel Finish', rate: 175 },
  { name: 'Metallic Accent Coating', rate: 260 },
  { name: '3D Textured Plaster', rate: 110 },
  { name: 'Premium Wallpaper Install', rate: 65 },
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { deletedAt: null } });
  const templates = await prisma.quotationTemplate.findMany({ where: { deletedAt: null } });
  const categories = await prisma.galleryCategory.findMany({ where: { deletedAt: null } });

  if (!admin || templates.length === 0 || categories.length === 0) {
    throw new Error('Run `npm run prisma:seed` first — baseline admin/templates/categories are missing.');
  }
  const timeForTexture = templates.find((t) => t.code === 'TIME_FOR_TEXTURE') ?? templates[0];
  const artiqueSurface = templates.find((t) => t.code === 'ARTIQUE_SURFACE') ?? templates[0];

  console.log('Seeding leads...');
  const createdCustomers: Array<{
    customer: Awaited<ReturnType<typeof prisma.customer.create>>;
    lead: (typeof LEADS)[number];
  }> = [];
  for (const [i, lead] of LEADS.entries()) {
    const loc = pick(CITIES, i);
    const customer = await prisma.customer.create({
      data: {
        customerName: lead.customerName,
        companyName: lead.companyName,
        phone: `98${String(10000000 + i * 137).slice(0, 8)}`,
        whatsapp: `98${String(10000000 + i * 137).slice(0, 8)}`,
        email: `${lead.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        gstNumber: lead.companyName ? `24AAAAA${1000 + i}A1Z${i % 10}` : undefined,
        address: `${100 + i}, ${loc.city} Main Road`,
        city: loc.city,
        state: loc.state,
        pinCode: `3800${10 + i}`,
        leadSource: lead.leadSource,
        requirement: lead.requirement,
        priority: lead.priority,
        status: lead.status,
        followUpDate:
          lead.status === LeadStatus.WON || lead.status === LeadStatus.LOST ? undefined : daysFromNow(lead.daysFollowUp),
        siteVisitDate: lead.daysSiteVisit !== undefined ? daysFromNow(lead.daysSiteVisit) : undefined,
        remarks: 'Imported as demo/test data.',
        createdById: admin.id,
        updatedById: admin.id,
        activities: {
          create: [
            {
              type: 'STATUS_CHANGE',
              title: 'Lead created',
              description: `Lead created via ${lead.leadSource.replace('_', ' ').toLowerCase()}`,
              activityDate: daysFromNow(-7 - i),
              createdById: admin.id,
            },
            {
              type: 'CALL',
              title: 'Initial call with customer',
              description: 'Discussed requirement and budget expectations.',
              activityDate: daysFromNow(-5 - i),
              createdById: admin.id,
            },
            ...(lead.status !== LeadStatus.NEW
              ? [
                  {
                    type: 'STATUS_CHANGE' as const,
                    title: `Status changed to ${lead.status}`,
                    activityDate: daysFromNow(-2 - i),
                    createdById: admin.id,
                  },
                ]
              : []),
          ],
        },
      },
    });
    createdCustomers.push({ customer, lead });
  }
  console.log(`Created ${createdCustomers.length} leads with activity timelines`);

  console.log('Seeding quotations...');
  let quotationCount = 0;
  let projectCount = 0;

  for (const [i, { customer, lead }] of createdCustomers.entries()) {
    // Only give quotations to leads that have progressed past first contact.
    if (lead.status === LeadStatus.NEW) continue;

    const itemCount = 1 + (i % 3);
    const items = Array.from({ length: itemCount }, (_, j) => {
      const product = pick(TEXTURE_PRODUCTS, i + j);
      const sqft = 80 + ((i + j) % 6) * 40;
      const amount = sqft * product.rate;
      return { productName: product.name, sqft, rate: product.rate, amount, measurement: `${10 + j}ft x ${8 + j}ft` };
    });
    const subTotal = items.reduce((s, it) => s + it.amount, 0);
    const discountValue = 5;
    const discountAmount = Math.round((subTotal * discountValue) / 100);
    const gstEnabled = i % 2 === 0;
    const gstPercentage = 18;
    const afterDiscount = subTotal - discountAmount;
    const gstAmount = gstEnabled ? Math.round((afterDiscount * gstPercentage) / 100) : 0;
    const transportationCharges = 500;
    const installationCharges = 1000;
    const grandTotal = afterDiscount + gstAmount + transportationCharges + installationCharges;

    const statusMap: Record<string, 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CONVERTED'> = {
      [LeadStatus.CONTACTED]: 'DRAFT',
      [LeadStatus.SITE_VISIT_SCHEDULED]: 'DRAFT',
      [LeadStatus.SITE_VISIT_DONE]: 'SENT',
      [LeadStatus.QUOTATION_SENT]: 'SENT',
      [LeadStatus.NEGOTIATION]: 'SENT',
      [LeadStatus.WON]: 'CONVERTED',
      [LeadStatus.LOST]: 'REJECTED',
      [LeadStatus.ON_HOLD]: 'APPROVED',
    };
    const status = statusMap[lead.status] ?? 'DRAFT';
    const year = new Date().getFullYear();
    const quotationNumber = `QT-${year}-${String(1000 + quotationCount).padStart(4, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: customer.id,
        projectName: `${lead.requirement.split(',')[0]}`,
        templateId: i % 2 === 0 ? timeForTexture.id : artiqueSurface.id,
        status,
        quotationDate: daysFromNow(-10 + i),
        validUntil: daysFromNow(20 - i),
        subTotal,
        discountType: 'PERCENTAGE',
        discountValue,
        discountAmount,
        gstEnabled,
        gstPercentage,
        gstAmount,
        transportationCharges,
        installationCharges,
        additionalCharges: 0,
        grandTotal,
        termsConditions: '50% advance payment required to confirm the order, balance on completion.',
        notes: 'Demo/test quotation.',
        approvedAt: ['APPROVED', 'CONVERTED'].includes(status) ? daysFromNow(-3 + i) : undefined,
        approvedById: ['APPROVED', 'CONVERTED'].includes(status) ? admin.id : undefined,
        rejectedAt: status === 'REJECTED' ? daysFromNow(-1) : undefined,
        rejectedById: status === 'REJECTED' ? admin.id : undefined,
        rejectionReason: status === 'REJECTED' ? 'Customer found the price too high for the requested area.' : undefined,
        convertedToProjectAt: status === 'CONVERTED' ? daysFromNow(-1) : undefined,
        createdById: admin.id,
        updatedById: admin.id,
        items: {
          create: items.map((it, idx) => ({
            srNo: idx + 1,
            productName: it.productName,
            description: `${it.productName} — professional application`,
            measurement: it.measurement,
            sqft: it.sqft,
            rate: it.rate,
            amount: it.amount,
            sortOrder: idx,
            createdById: admin.id,
          })),
        },
      },
    });
    quotationCount++;

    if (status === 'CONVERTED') {
      const progressPercentage = i % 3 === 0 ? 100 : i % 3 === 1 ? 60 : 20;
      const projectStatus: ProjectStatus =
        progressPercentage === 100 ? ProjectStatus.COMPLETED : progressPercentage >= 50 ? ProjectStatus.IN_PROGRESS : ProjectStatus.STARTED;

      const project = await prisma.projectTracking.create({
        data: {
          projectName: quotation.projectName,
          customerId: customer.id,
          quotationId: quotation.id,
          startDate: daysFromNow(-15),
          expectedCompletionDate: daysFromNow(10),
          actualCompletionDate: projectStatus === ProjectStatus.COMPLETED ? daysFromNow(-1) : undefined,
          status: projectStatus,
          assignedTeam: pick(['Team A - Ramesh, Suresh', 'Team B - Mahesh, Ganesh', 'Team C - Dinesh, Naresh'], i),
          progressPercentage,
          currentStage: pick(['Surface preparation', 'Base coat applied', 'Texture application', 'Finishing & polish'], i),
          remarks: 'Demo/test project.',
          createdById: admin.id,
          updatedById: admin.id,
        },
      });
      projectCount++;
    }
  }
  console.log(`Created ${quotationCount} quotations, ${projectCount} projects`);

  console.log('Seeding gallery images...');
  const galleryColors: [number, number, number][] = [
    [180, 160, 140], [200, 190, 175], [160, 140, 120], [210, 200, 190],
    [170, 150, 130], [190, 180, 165], [150, 130, 110], [220, 210, 200],
    [175, 155, 135],
  ];
  let galleryCount = 0;

  // DESIGN entries — the texture/material catalog ("What we make").
  const designEntries: Array<{ title: string; description: string; tags: string[] }> = [
    {
      title: 'Texture coats',
      description:
        'Mineral plaster mixed on site and worked by hand, so the wall carries depth instead of a printed pattern. Breathable, wipeable, and repairable in place.',
      tags: ['Lime plaster', 'Micro-cement', 'Travertine', 'Roman clay'],
    },
    {
      title: 'Wood slat panels',
      description:
        'Solid battens on an acoustic felt backing. We set the reveal to your ceiling height so the rhythm lands right, then oil-finish them on site.',
      tags: ['Teak', 'White oak', 'Ash', 'Charred pine'],
    },
  ];
  for (const [i, category] of categories.entries()) {
    for (let j = 0; j < 2; j++) {
      const imageUrl = writePlaceholderImage('gallery', pick(galleryColors, i + j));
      const entry = designEntries[(i + j) % designEntries.length];
      await prisma.gallery.create({
        data: {
          title: j === 0 && i < designEntries.length ? entry.title : `${category.name} Sample ${j + 1}`,
          type: 'DESIGN',
          categoryId: category.id,
          description: j === 0 && i < designEntries.length ? entry.description : `Showcase piece for ${category.name.toLowerCase()}.`,
          tags: j === 0 && i < designEntries.length ? JSON.stringify(entry.tags) : undefined,
          imageUrl,
          thumbnailUrl: imageUrl,
          isFeatured: j === 0 && i < 3,
          sortOrder: j,
          status: 'ACTIVE',
          createdById: admin.id,
          updatedById: admin.id,
        },
      });
      galleryCount++;
    }
  }

  // PORTFOLIO entries — completed projects ("Rooms we have resurfaced").
  const residentialCategory = categories.find((c) => c.name === 'Residential') ?? categories[0];
  const commercialCategory = categories.find((c) => c.name === 'Commercial') ?? categories[0];
  const portfolioEntries: Array<{ title: string; subtitle: string; categoryId: string; color: [number, number, number] }> = [
    { title: 'Neelankarai villa', subtitle: 'Roman clay, 4 rooms · 2025', categoryId: residentialCategory.id, color: [196, 164, 156] },
    { title: 'Alwarpet apartment', subtitle: 'Teak slat feature wall · 2025', categoryId: residentialCategory.id, color: [180, 140, 90] },
    { title: 'Besant Nagar studio', subtitle: 'Micro-cement, full shell · 2024', categoryId: commercialCategory.id, color: [170, 172, 175] },
  ];
  for (const entry of portfolioEntries) {
    const imageUrl = writePlaceholderImage('gallery', entry.color);
    await prisma.gallery.create({
      data: {
        title: entry.title,
        type: 'PORTFOLIO',
        categoryId: entry.categoryId,
        subtitle: entry.subtitle,
        imageUrl,
        thumbnailUrl: imageUrl,
        isFeatured: true,
        status: 'ACTIVE',
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
    galleryCount++;
  }

  console.log(`Created ${galleryCount} gallery images across ${categories.length} categories`);

  console.log('Seeding WhatsApp message history...');
  const messageableCustomers = createdCustomers.filter((c) => c.lead.status !== LeadStatus.NEW).slice(0, 8);
  let messageCount = 0;
  for (const [i, { customer }] of messageableCustomers.entries()) {
    await prisma.whatsAppMessage.create({
      data: {
        customerId: customer.id,
        direction: 'OUTBOUND',
        type: i % 3 === 0 ? 'QUOTATION_PDF' : 'TEXT',
        toNumber: customer.whatsapp ?? customer.phone,
        content: i % 3 === 0 ? `Please find attached your quotation.` : 'Hi! Thank you for your enquiry, our team will visit you soon.',
        fileName: i % 3 === 0 ? `QT-${new Date().getFullYear()}-${1000 + i}.pdf` : undefined,
        status: pick(['SENT', 'DELIVERED', 'READ', 'FAILED'], i) as never,
        errorMessage: i % 5 === 4 ? 'Recipient number not on WhatsApp' : undefined,
        sentAt: daysFromNow(-i),
        createdById: admin.id,
      },
    });
    messageCount++;
  }
  console.log(`Created ${messageCount} WhatsApp message records`);

  console.log('Seeding testimonials...');
  const testimonials: Array<{ customerName: string; role: string; quote: string; rating: number; isFeatured: boolean }> = [
    {
      customerName: 'Priya Ramesh',
      role: 'Neelankarai villa, 2025',
      quote:
        'They spent a week getting the Roman clay tone right before touching the wall. No two rooms in the house look the same, in a good way.',
      rating: 5,
      isFeatured: true,
    },
    {
      customerName: 'Arvind Kumar',
      role: 'Alwarpet apartment, 2025',
      quote:
        'The teak slat wall was cut and finished on site to match our ceiling height exactly. Zero repeat pattern, exactly as promised.',
      rating: 5,
      isFeatured: true,
    },
    {
      customerName: 'Meena Krishnan',
      role: 'Besant Nagar studio, 2024',
      quote:
        'Sample patches stayed on our wall for a week before we committed to micro-cement. That patience showed in the final finish.',
      rating: 5,
      isFeatured: false,
    },
  ];
  for (let i = 0; i < testimonials.length; i++) {
    const t = testimonials[i];
    await prisma.testimonial.create({
      data: {
        customerName: t.customerName,
        role: t.role,
        quote: t.quote,
        rating: t.rating,
        isFeatured: t.isFeatured,
        sortOrder: i,
        status: 'ACTIVE',
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }
  console.log(`Created ${testimonials.length} testimonials`);

  console.log('Seeding notifications...');
  const notifications: Array<{ type: 'LEAD_FOLLOWUP' | 'QUOTATION_REMINDER' | 'PROJECT_STATUS' | 'WHATSAPP_ALERT' | 'SYSTEM'; title: string; message: string; link: string; isRead: boolean }> = [
    { type: 'LEAD_FOLLOWUP', title: 'Follow-up due', message: 'Follow up with Suresh Iyer — overdue by 2 days', link: '/leads', isRead: false },
    { type: 'QUOTATION_REMINDER', title: 'Quotation expiring soon', message: 'A quotation is awaiting customer response', link: '/quotations', isRead: false },
    { type: 'PROJECT_STATUS', title: 'Project deadline approaching', message: 'One project is nearing its expected completion date', link: '/tracking', isRead: true },
    { type: 'WHATSAPP_ALERT', title: 'WhatsApp disconnected', message: 'WhatsApp session was disconnected — reconnect from Settings', link: '/settings', isRead: true },
    { type: 'SYSTEM', title: 'Welcome to Wall Texture CRM', message: 'Demo data has been loaded — explore leads, quotations, tracking and gallery.', link: '/dashboard', isRead: false },
  ];
  for (const n of notifications) {
    await prisma.notification.create({
      data: { userId: admin.id, type: n.type, title: n.title, message: n.message, link: n.link, isRead: n.isRead, readAt: n.isRead ? new Date() : undefined },
    });
  }
  console.log(`Created ${notifications.length} notifications`);

  console.log('\nDemo data seeding complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
