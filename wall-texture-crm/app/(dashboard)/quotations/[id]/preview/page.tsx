import { QuotationPreviewClient } from "@/modules/quotations/quotation-preview-client";

export default async function QuotationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuotationPreviewClient id={id} />;
}
