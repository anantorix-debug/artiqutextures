export const LeadSource = {
  WEBSITE: "WEBSITE",
  REFERRAL: "REFERRAL",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  WALK_IN: "WALK_IN",
  PHONE_CALL: "PHONE_CALL",
  ADVERTISEMENT: "ADVERTISEMENT",
  EXHIBITION: "EXHIBITION",
  OTHER: "OTHER",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LeadPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type LeadPriority = (typeof LeadPriority)[keyof typeof LeadPriority];

export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  SITE_VISIT_SCHEDULED: "SITE_VISIT_SCHEDULED",
  SITE_VISIT_DONE: "SITE_VISIT_DONE",
  QUOTATION_SENT: "QUOTATION_SENT",
  NEGOTIATION: "NEGOTIATION",
  WON: "WON",
  LOST: "LOST",
  ON_HOLD: "ON_HOLD",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const ActivityType = {
  NOTE: "NOTE",
  CALL: "CALL",
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
  SITE_VISIT: "SITE_VISIT",
  FOLLOW_UP: "FOLLOW_UP",
  STATUS_CHANGE: "STATUS_CHANGE",
  QUOTATION: "QUOTATION",
  MEETING: "MEETING",
  OTHER: "OTHER",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const QuotationStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  VIEWED: "VIEWED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CONVERTED: "CONVERTED",
} as const;
export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export const QuotationTemplateCode = {
  TIME_FOR_TEXTURE: "TIME_FOR_TEXTURE",
  ARTIQUE_SURFACE: "ARTIQUE_SURFACE",
  MODERN_MINIMAL: "MODERN_MINIMAL",
  LUXURY_TEXTURE: "LUXURY_TEXTURE",
  CLASSIC: "CLASSIC",
  TFT_CLASSIC: "TFT_CLASSIC",
  TFT_MINIMAL: "TFT_MINIMAL",
  TFT_LUXURY: "TFT_LUXURY",
} as const;
export type QuotationTemplateCode = (typeof QuotationTemplateCode)[keyof typeof QuotationTemplateCode];

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const ProjectStatus = {
  PENDING: "PENDING",
  STARTED: "STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const GalleryStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type GalleryStatus = (typeof GalleryStatus)[keyof typeof GalleryStatus];

export const GalleryType = {
  PORTFOLIO: "PORTFOLIO",
  DESIGN: "DESIGN",
} as const;
export type GalleryType = (typeof GalleryType)[keyof typeof GalleryType];

export const WhatsAppSessionStatus = {
  DISCONNECTED: "DISCONNECTED",
  INITIALIZING: "INITIALIZING",
  QR_PENDING: "QR_PENDING",
  CONNECTED: "CONNECTED",
  AUTH_FAILED: "AUTH_FAILED",
} as const;
export type WhatsAppSessionStatus = (typeof WhatsAppSessionStatus)[keyof typeof WhatsAppSessionStatus];

export const WhatsAppMessageDirection = {
  OUTBOUND: "OUTBOUND",
  INBOUND: "INBOUND",
} as const;
export type WhatsAppMessageDirection = (typeof WhatsAppMessageDirection)[keyof typeof WhatsAppMessageDirection];

export const WhatsAppMessageStatus = {
  QUEUED: "QUEUED",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
  FAILED: "FAILED",
} as const;
export type WhatsAppMessageStatus = (typeof WhatsAppMessageStatus)[keyof typeof WhatsAppMessageStatus];

export const WhatsAppMessageType = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  DOCUMENT: "DOCUMENT",
  QUOTATION_PDF: "QUOTATION_PDF",
  GALLERY_IMAGE: "GALLERY_IMAGE",
} as const;
export type WhatsAppMessageType = (typeof WhatsAppMessageType)[keyof typeof WhatsAppMessageType];

export const NotificationType = {
  LEAD_FOLLOWUP: "LEAD_FOLLOWUP",
  QUOTATION_REMINDER: "QUOTATION_REMINDER",
  PROJECT_STATUS: "PROJECT_STATUS",
  WHATSAPP_ALERT: "WHATSAPP_ALERT",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const SettingCategory = {
  WHATSAPP: "WHATSAPP",
  SMTP: "SMTP",
  GENERAL: "GENERAL",
} as const;
export type SettingCategory = (typeof SettingCategory)[keyof typeof SettingCategory];

export const ExpenseCategory = {
  MATERIAL: "MATERIAL",
  LABOUR: "LABOUR",
  TRANSPORTATION: "TRANSPORTATION",
  TOOLS: "TOOLS",
  CONTRACTOR: "CONTRACTOR",
  ELECTRICITY: "ELECTRICITY",
  MISCELLANEOUS: "MISCELLANEOUS",
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const PaymentMethod = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  UPI: "UPI",
  CHEQUE: "CHEQUE",
  CARD: "CARD",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PhotoStage = {
  BEFORE: "BEFORE",
  DURING: "DURING",
  FINISHED: "FINISHED",
  DETAIL: "DETAIL",
  OTHER: "OTHER",
} as const;
export type PhotoStage = (typeof PhotoStage)[keyof typeof PhotoStage];
