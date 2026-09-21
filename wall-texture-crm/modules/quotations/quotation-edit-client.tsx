"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QuotationForm } from "./quotation-form";
import { useQuotation, useUpdateQuotation } from "@/hooks/use-quotations";
import type { QuotationFormValues } from "@/services/quotation.service";

export function QuotationEditClient({ id }: { id: string }) {
  const { data: quotation, isLoading } = useQuotation(id);
  const updateQuotation = useUpdateQuotation(id);
  const router = useRouter();

  if (isLoading || !quotation) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/quotations/${id}`}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Quotation
      </Link>
      <PageHeader title={`Edit ${quotation.quotationNumber}`} description="Changes are tracked in the revision history" />
      <QuotationForm
        quotation={quotation}
        onSubmit={(values: QuotationFormValues) => updateQuotation.mutate(values, { onSuccess: () => router.push(`/quotations/${id}/preview`) })}
        submitLabel="Save Changes"
        submitting={updateQuotation.isPending}
      />
    </div>
  );
}
