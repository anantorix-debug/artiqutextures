import { QuotationDetailClient } from "@/modules/quotations/quotation-detail-client";

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuotationDetailClient id={id} />;
}
