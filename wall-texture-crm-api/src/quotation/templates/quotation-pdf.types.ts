export interface QuotationPdfItem {
  srNo: number;
  productName: string;
  description?: string | null;
  measurement?: string | null;
  sqft: number;
  rate: number;
  amount: number;
}

/** Company branding pulled from Settings — the same object feeds every template. */
export interface QuotationPdfCompany {
  name: string;
  tagline?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  gstNumber?: string | null;
  /** Absolute file path to a PNG/JPG logo, or null → a neutral placeholder is drawn. */
  logoPath?: string | null;
}

export interface QuotationPdfData {
  quotationNumber: string;
  quotationDate: Date;
  validUntil?: Date | null;
  projectName: string;
  version: number;

  company: QuotationPdfCompany;

  customerName: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  gstNumber?: string | null;

  items: QuotationPdfItem[];

  subTotal: number;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  gstEnabled: boolean;
  gstPercentage: number;
  gstAmount: number;
  transportationCharges: number;
  installationCharges: number;
  additionalCharges: number;
  grandTotal: number;

  /** Advance the customer must pay to confirm the order (0 = not required). */
  advanceRequired: number;

  termsConditions?: string | null;
  notes?: string | null;
  signatureUrl?: string | null;
}

export const DEFAULT_TERMS = [
  '50% advance payment required to confirm the order, balance on completion.',
  'Prices are valid for the validity period mentioned above.',
  'Material wastage, if any, will be billed separately.',
  'Any change in scope of work will be quoted separately.',
  'Warranty as per manufacturer terms for the applied product.',
].join('\n');
