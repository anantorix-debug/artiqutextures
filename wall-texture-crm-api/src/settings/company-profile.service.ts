import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfig } from '../config/configuration';
import { FileStorageService } from '../shared/services/file-storage.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

export interface CompanyProfile {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  /** Public URL path of the uploaded logo (e.g. /uploads/branding/xyz.png), or null until one is uploaded. */
  logoUrl: string | null;
  defaultTerms: string;
  defaultNotes: string;
  quotationPrefix: string;
  defaultTemplateCode: string;
  defaultValidityDays: number;
  defaultAdvancePercent: number;

  /** Second brand / company ("Time For Texture") — used by that quotation template only. */
  tftName: string;
  tftTagline: string;
  tftAddress: string;
  tftPhone: string;
  tftEmail: string;
  tftWebsite: string;
  tftGstNumber: string;
  tftLogoUrl: string | null;
}

export const DEFAULT_TERMS = [
  '50% advance payment required to confirm the order, balance on completion.',
  'Prices are valid for the validity period mentioned above.',
  'Material wastage, if any, will be billed separately.',
  'Any change in scope of work will be quoted separately.',
  'Warranty as per manufacturer terms for the applied product.',
].join('\n');

const DEFAULTS: CompanyProfile = {
  companyName: 'Your Company Name',
  tagline: 'Wall Textures · Surface Finishes · Wallpaper',
  address: '',
  phone: '',
  email: '',
  website: '',
  gstNumber: '',
  logoUrl: null,
  defaultTerms: DEFAULT_TERMS,
  defaultNotes: '',
  quotationPrefix: 'QT',
  defaultTemplateCode: 'ARTIQUE_SURFACE',
  defaultValidityDays: 15,
  defaultAdvancePercent: 50,
  tftName: 'Time For Texture',
  tftTagline: 'Wall Textures & Decorative Finishes',
  tftAddress: '',
  tftPhone: '',
  tftEmail: '',
  tftWebsite: '',
  tftGstNumber: '',
  tftLogoUrl: null,
};

/** Company key/value settings live in the existing `settings` table under the GENERAL category. */
const CATEGORY = 'GENERAL' as const;

/**
 * Single source of truth for company branding (name, contact, logo, quotation
 * defaults). Quotation previews, PDFs, print and WhatsApp sharing all read
 * from here, so uploading a logo once updates every document.
 */
@Injectable()
export class CompanyProfileService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly fileStorage: FileStorageService,
  ) {
    this.uploadDir = this.configService.get<AppConfig>('app')!.upload.dir;
  }

  async getProfile(): Promise<CompanyProfile> {
    const rows = await this.prisma.setting.findMany({
      where: { category: CATEGORY, deletedAt: null },
    });
    const map = new Map(rows.map((r) => [r.key, r.value ?? '']));
    const str = (key: keyof CompanyProfile, fallback: string) => {
      const v = map.get(key);
      return v === undefined || v === '' ? fallback : v;
    };
    const num = (key: keyof CompanyProfile, fallback: number) => {
      const n = Number(map.get(key));
      return map.has(key) && map.get(key) !== '' && Number.isFinite(n)
        ? n
        : fallback;
    };

    return {
      companyName: str('companyName', DEFAULTS.companyName),
      tagline: str('tagline', DEFAULTS.tagline),
      address: map.get('address') ?? DEFAULTS.address,
      phone: map.get('phone') ?? DEFAULTS.phone,
      email: map.get('email') ?? DEFAULTS.email,
      website: map.get('website') ?? DEFAULTS.website,
      gstNumber: map.get('gstNumber') ?? DEFAULTS.gstNumber,
      logoUrl: map.get('logoUrl') || null,
      defaultTerms: map.has('defaultTerms')
        ? (map.get('defaultTerms') ?? '')
        : DEFAULTS.defaultTerms,
      defaultNotes: map.get('defaultNotes') ?? DEFAULTS.defaultNotes,
      quotationPrefix: (
        str('quotationPrefix', DEFAULTS.quotationPrefix) || 'QT'
      )
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, ''),
      defaultTemplateCode: str(
        'defaultTemplateCode',
        DEFAULTS.defaultTemplateCode,
      ),
      defaultValidityDays: num(
        'defaultValidityDays',
        DEFAULTS.defaultValidityDays,
      ),
      defaultAdvancePercent: num(
        'defaultAdvancePercent',
        DEFAULTS.defaultAdvancePercent,
      ),
      tftName: str('tftName', DEFAULTS.tftName),
      tftTagline: map.has('tftTagline')
        ? (map.get('tftTagline') ?? '')
        : DEFAULTS.tftTagline,
      tftAddress: map.get('tftAddress') ?? '',
      tftPhone: map.get('tftPhone') ?? '',
      tftEmail: map.get('tftEmail') ?? '',
      tftWebsite: map.get('tftWebsite') ?? '',
      tftGstNumber: map.get('tftGstNumber') ?? '',
      tftLogoUrl: map.get('tftLogoUrl') || null,
    };
  }

  async updateProfile(dto: UpdateCompanyProfileDto, userId?: string) {
    const entries = Object.entries(dto).filter(([, v]) => v !== undefined);
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { category_key: { category: CATEGORY, key } },
          update: { value: String(value), deletedAt: null, updatedById: userId },
          create: {
            category: CATEGORY,
            key,
            value: String(value),
            createdById: userId,
            updatedById: userId,
          },
        }),
      ),
    );
    return this.getProfile();
  }

  private async setValue(key: string, value: string, userId?: string) {
    await this.prisma.setting.upsert({
      where: { category_key: { category: CATEGORY, key } },
      update: { value, deletedAt: null, updatedById: userId },
      create: {
        category: CATEGORY,
        key,
        value,
        createdById: userId,
        updatedById: userId,
      },
    });
  }

  async setLogo(
    publicUrl: string,
    userId?: string,
    key: 'logoUrl' | 'tftLogoUrl' = 'logoUrl',
  ) {
    const previous = (await this.getProfile())[key];
    await this.setValue(key, publicUrl, userId);
    if (previous && previous !== publicUrl) {
      this.fileStorage.deleteByPublicUrl(previous);
    }
    return this.getProfile();
  }

  async removeLogo(userId?: string, key: 'logoUrl' | 'tftLogoUrl' = 'logoUrl') {
    const previous = (await this.getProfile())[key];
    await this.setValue(key, '', userId);
    this.fileStorage.deleteByPublicUrl(previous);
    return this.getProfile();
  }

  /** Absolute on-disk path of the logo for PDF embedding, or undefined if none / missing. */
  async getLogoFilePath(
    key: 'logoUrl' | 'tftLogoUrl' = 'logoUrl',
  ): Promise<string | undefined> {
    const logoUrl = (await this.getProfile())[key];
    if (!logoUrl) return undefined;
    const abs = join(process.cwd(), logoUrl.replace(/^\//, ''));
    return existsSync(abs) && abs.includes(this.uploadDir) ? abs : undefined;
  }
}
