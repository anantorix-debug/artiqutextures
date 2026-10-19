import { CompanyProfile } from '../../settings/company-profile.service';
import { QuotationPdfBankDetails, QuotationPdfCompany } from './quotation-pdf.types';

/** Brand-specific company block (name/contact/logo) shared by Quotation and Proforma Invoice PDFs. */
export function brandCompanyFromProfile(
  profile: CompanyProfile,
  secondBrand: boolean,
  logoPath?: string,
): QuotationPdfCompany {
  return secondBrand
    ? {
        name: profile.tftName,
        tagline: profile.tftTagline,
        address: profile.tftAddress,
        phone: profile.tftPhone,
        email: profile.tftEmail,
        website: profile.tftWebsite,
        gstNumber: profile.tftGstNumber,
        logoPath: logoPath ?? null,
      }
    : {
        name: profile.companyName,
        tagline: profile.tagline,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        gstNumber: profile.gstNumber,
        logoPath: logoPath ?? null,
      };
}

/** The one shared bank account, shown on both Quotation and Proforma Invoice PDFs once set in Settings. */
export function bankDetailsFromProfile(
  profile: CompanyProfile,
): QuotationPdfBankDetails | null {
  if (!profile.bankAccountName || !profile.bankAccountNumber) return null;
  return {
    accountName: profile.bankAccountName,
    accountNumber: profile.bankAccountNumber,
    ifsc: profile.bankIfsc,
    bankName: profile.bankName,
    branch: profile.bankBranch || null,
    upiId: profile.bankUpiId || null,
  };
}
