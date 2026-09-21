"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { quotationColumns } from "@/modules/quotations/quotation-columns";
import { useQuotations } from "@/hooks/use-quotations";
import { useDebounce } from "@/hooks/use-debounce";
import { QuotationStatus } from "@/types/enums";
import { formatStatusLabel } from "@/lib/format";
import type { Quotation } from "@/types/entities";

export default function QuotationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuotations({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: (status || undefined) as never,
  });

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Create, track and manage customer quotations"
        actions={
          <Button onClick={() => router.push("/quotations/new")}>
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotation #, project, customer..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={status || "ALL"} onValueChange={(v) => { setStatus(v === "ALL" || !v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(QuotationStatus).map((s) => (
              <SelectItem key={s} value={s}>{formatStatusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable<Quotation>
        columns={quotationColumns}
        data={data?.items ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/quotations/${row.id}`)}
        emptyLabel="No quotations found"
      />
    </div>
  );
}
