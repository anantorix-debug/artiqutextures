"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackingColumns } from "@/modules/tracking/tracking-columns";
import { useProjects } from "@/hooks/use-tracking";
import { useDebounce } from "@/hooks/use-debounce";
import { ProjectStatus } from "@/types/enums";
import { formatProjectStatus } from "@/lib/format";
import type { ProjectTracking } from "@/types/entities";

export default function TrackingPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useProjects({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: (status || undefined) as never,
  });

  return (
    <div>
      <PageHeader title="Project Tracking" description="Track work from kickoff to completion" />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search project or customer..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={status || "ALL"} onValueChange={(v) => { setStatus(v === "ALL" || !v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status">{status ? formatProjectStatus(status) : "All Statuses"}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(ProjectStatus).map((s) => (
              <SelectItem key={s} value={s}>{formatProjectStatus(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable<ProjectTracking>
        columns={trackingColumns}
        data={data?.items ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/tracking/${row.id}`)}
        emptyLabel="No projects yet — convert an approved quotation to get started"
      />
    </div>
  );
}
