import type {
  ActivityType,
  GalleryStatus,
  GalleryType,
  LeadPriority,
  LeadSource,
  LeadStatus,
  NotificationType,
  ProjectStatus,
  QuotationStatus,
  QuotationTemplateCode,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
  WhatsAppSessionStatus,
} from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  companyName?: string | null;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  leadSource: LeadSource;
  referredBy?: string | null;
  requirement?: string | null;
  priority: LeadPriority;
  status: LeadStatus;
  followUpDate?: string | null;
  siteVisitDate?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { quotations: number; projects: number; activities: number };
}

export interface CustomerActivity {
  id: string;
  customerId: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  activityDate: string;
  createdAt: string;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  code: QuotationTemplateCode;
  description?: string | null;
  previewImageUrl?: string | null;
  isActive: boolean;
  isDefault: boolean;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  srNo: number;
  productName: string;
  description?: string | null;
  measurement?: string | null;
  sqft: string | number;
  rate: string | number;
  amount: string | number;
  sortOrder: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  projectName: string;
  templateId: string;
  status: QuotationStatus;
  quotationDate: string;
  validUntil?: string | null;
  subTotal: string | number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string | number;
  discountAmount: string | number;
  gstEnabled: boolean;
  gstPercentage: string | number;
  gstAmount: string | number;
  transportationCharges: string | number;
  installationCharges: string | number;
  additionalCharges: string | number;
  grandTotal: string | number;
  advanceRequired: string | number;
  termsConditions?: string | null;
  notes?: string | null;
  version: number;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  convertedToProjectAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  template?: QuotationTemplate;
  items?: QuotationItem[];
  project?: ProjectTracking | null;
  _count?: { items: number };
}

export interface QuotationRevision {
  id: string;
  quotationId: string;
  versionNumber: number;
  snapshot: unknown;
  changeNote?: string | null;
  createdAt: string;
}

export interface ProjectTracking {
  id: string;
  projectName: string;
  customerId: string;
  quotationId: string;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  status: ProjectStatus;
  assignedTeam?: string | null;
  progressPercentage: number;
  currentStage?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  quotation?: Pick<Quotation, "id" | "quotationNumber" | "grandTotal" | "advanceRequired" | "status" | "quotationDate">;
  galleryEntry?: { id: string; deletedAt?: string | null } | null;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { images: number };
}

export interface GalleryImage {
  id: string;
  title: string;
  type: GalleryType;
  categoryId?: string | null;
  description?: string | null;
  subtitle?: string | null;
  tags: string[];
  imageUrl: string;
  thumbnailUrl?: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: GalleryStatus;
  createdAt: string;
  category?: GalleryCategory | null;
  projectId?: string | null;
  completedAt?: string | null;
  materialsUsed?: Array<{ name: string; brand?: string | null; quantity?: number; unit?: string }>;
  colorsUsed?: Array<{ name: string; hexCode: string; brand?: string | null; shadeNumber?: string | null; finish?: string | null; usedIn?: string | null }>;
  photos?: Array<{ id: string; fileUrl: string; thumbnailUrl?: string | null; caption?: string | null; sortOrder: number }>;
  project?: { id: string; projectName: string } | null;
}

export interface Testimonial {
  id: string;
  customerName: string;
  role?: string | null;
  quote: string;
  rating?: number | null;
  avatarUrl?: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: GalleryStatus;
  createdAt: string;
}

export interface WhatsAppSession {
  id?: string;
  sessionName?: string;
  status: WhatsAppSessionStatus;
  phoneNumber?: string | null;
  qrCode?: string | null;
  isConnected: boolean;
  lastConnectedAt?: string | null;
  lastDisconnectedAt?: string | null;
}

export interface WhatsAppMessage {
  id: string;
  sessionId?: string | null;
  customerId?: string | null;
  quotationId?: string | null;
  galleryId?: string | null;
  direction: WhatsAppMessageDirection;
  type: WhatsAppMessageType;
  toNumber?: string | null;
  fromNumber?: string | null;
  content?: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  status: WhatsAppMessageStatus;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
  customer?: { id: string; customerName: string; phone: string } | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  unreadCount?: number;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface DatabaseBackup {
  id: string;
  fileName: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  fileSize?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------- project management

export interface ProjectExpense {
  id: string;
  projectId: string;
  expenseDate: string;
  category: import("./enums").ExpenseCategory;
  description: string;
  amount: string | number;
  paidBy?: string | null;
  vendor?: string | null;
  paymentMethod?: import("./enums").PaymentMethod | null;
  notes?: string | null;
  receiptUrl?: string | null;
}

export interface ProjectMaterial {
  id: string;
  projectId: string;
  quotationItemId?: string | null;
  name: string;
  brand?: string | null;
  quantity: string | number;
  unit: string;
  rate?: string | number | null;
  description?: string | null;
  notes?: string | null;
  quotationItem?: { id: string; srNo: number; productName: string } | null;
}

export interface ProjectColor {
  id: string;
  projectId: string;
  name: string;
  hexCode: string;
  brand?: string | null;
  shadeNumber?: string | null;
  finish?: string | null;
  usedIn?: string | null;
  referenceImageUrl?: string | null;
  notes?: string | null;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  stage: import("./enums").PhotoStage;
  fileUrl: string;
  fileName?: string | null;
  caption?: string | null;
  description?: string | null;
  takenAt?: string | null;
  materialId?: string | null;
  colorId?: string | null;
  material?: { id: string; name: string } | null;
  color?: { id: string; name: string; hexCode: string } | null;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  type: string;
  title: string;
  description?: string | null;
  createdAt: string;
  userName?: string | null;
}

export interface ProjectPayment {
  id: string;
  quotationId: string;
  projectId?: string | null;
  paymentDate: string;
  amount: string | number;
  method: import("./enums").PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface PaymentSummary {
  quotationId: string;
  quotationNumber: string;
  projectId: string | null;
  grandTotal: number;
  advanceRequired: number;
  amountReceived: number;
  balanceDue: number;
  advanceOutstanding: number;
  isFullyPaid: boolean;
  payments: ProjectPayment[];
}

export interface ProjectSummary {
  projectValue: number;
  totalExpenses: number;
  estimatedProfit: number;
  profitMargin: number;
  expenseCount: number;
  expensesByCategory: Array<{ category: string; total: number }>;
  materialCount: number;
  colorCount: number;
  photoCount: number;
  payments: PaymentSummary;
}

export interface CompanyProfile {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  logoUrl: string | null;
  defaultTerms: string;
  defaultNotes: string;
  quotationPrefix: string;
  defaultTemplateCode: string;
  defaultValidityDays: number;
  defaultAdvancePercent: number;
  tftName: string;
  tftTagline: string;
  tftAddress: string;
  tftPhone: string;
  tftEmail: string;
  tftWebsite: string;
  tftGstNumber: string;
  tftLogoUrl: string | null;
}

export interface BusinessSummary {
  totalQuotations: number;
  approvedQuotations: number;
  totalQuotationValue: number;
  totalProjectValue: number;
  totalExpenses: number;
  estimatedProfit: number;
  profitMargin: number;
  activeProjects: number;
  completedProjects: number;
  totalReceived: number;
  pendingPayments: number;
  expensesByCategory: Array<{ category: string; total: number }>;
  projectStatusSummary: Array<{ status: string; count: number }>;
}
