import { QuotationEditClient } from "@/modules/quotations/quotation-edit-client";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuotationEditClient id={id} />;
}
