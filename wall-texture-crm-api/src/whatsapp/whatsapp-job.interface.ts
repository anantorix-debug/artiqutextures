export const WHATSAPP_QUEUE = 'whatsapp-outgoing';

export type WhatsappJobType =
  'TEXT' | 'IMAGE' | 'DOCUMENT' | 'QUOTATION_PDF' | 'GALLERY_IMAGE';

export interface WhatsappJobPayload {
  messageId: string;
  toNumber: string;
  type: WhatsappJobType;
  content?: string;
  mediaBase64?: string;
  mediaMimeType?: string;
  fileName?: string;
}
