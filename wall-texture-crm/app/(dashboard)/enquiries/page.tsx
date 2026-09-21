"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { enquiryColumns } from "@/modules/enquiries/enquiry-columns";
import { useCustomers } from "@/hooks/use-customers";
import { useDebounce } from "@/hooks/use-debounce";
import type { Customer } from "@/types/entities";

/**
 * Everything submitted through the public website (the general contact form
 * and gallery "Request this" flow both save through the same lead pipeline
 * as the admin panel, tagged leadSource=WEBSITE) — this page is just a
 * dedicated, filtered view onto that same Leads data so website enquiries
 * don't get lost in the general Leads list. No separate data model.
 */
export default function EnquiriesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useCustomers({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    leadSource: "WEBSITE",
  });

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Contact form and gallery request submissions from the public website"
      />

      <div className="mb-4">
        <div className="relative sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable<Customer>
        columns={enquiryColumns}
        data={data?.items ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/leads/${row.id}`)}
        emptyLabel="No website enquiries yet."
      />
    </div>
  );
}
