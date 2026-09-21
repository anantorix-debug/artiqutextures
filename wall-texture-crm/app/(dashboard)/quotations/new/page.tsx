"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { QuotationForm } from "@/modules/quotations/quotation-form";
import { useCreateQuotation } from "@/hooks/use-quotations";
import { useCustomer } from "@/hooks/use-customers";
import type { QuotationFormValues } from "@/services/quotation.service";

function NewQuotationContent() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId") ?? undefined;
  const { data: preselectedCustomer } = useCustomer(customerId);
  const createQuotation = useCreateQuotation();

  return (
    <div>
      <Link href="/quotations" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Quotations
      </Link>
      <PageHeader title="New Quotation" description="Build a quotation for your customer" />
      <QuotationForm
        initialCustomer={preselectedCustomer}
        onSubmit={(values: QuotationFormValues) => createQuotation.mutate(values)}
        submitLabel="Create Quotation"
        submitting={createQuotation.isPending}
      />
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense>
      <NewQuotationContent />
    </Suspense>
  );
}
