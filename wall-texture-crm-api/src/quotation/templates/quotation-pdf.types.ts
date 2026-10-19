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

export interface QuotationPdfBankDetails {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch?: string | null;
  upiId?: string | null;
}

export interface QuotationPdfData {
  quotationNumber: string;
  quotationDate: Date;
  validUntil?: Date | null;
  projectName: string;
  version: number;

  /** Big header title. Defaults to 'Quotation' — set to 'Proforma Invoice' for that document. */
  docLabel?: string;
  /** Label for the number row in the Project & quotation block. Defaults to 'Quotation #'. */
  numberLabel?: string;

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

  /** Shared bank account, shown near the terms if set — same account for both brands. */
  bankDetails?: QuotationPdfBankDetails | null;

  /** Proforma Invoice only: live amount received / balance due against the quotation. */
  paymentSummary?: { amountReceived: number; balanceDue: number } | null;
}

export const DEFAULT_TERMS = [
  'Scaffolding: The client shall arrange and provide scaffolding wherever rope access scaffolding is not feasible.',
  'GST: GST at 18% shall be charged additionally over and above the quoted price.',
  'Additional Rework: Any rework or rectification required after completion of the texture work shall be charged separately.',
  'Measurement & Billing: The quotation is based on the square footage provided by the client. Final measurements shall be taken upon completion of the work, and the final bill may vary by approximately ±10% based on the actual measured area.',
].join('\n');
