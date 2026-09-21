"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Download, FileSpreadsheet, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { leadColumns } from "@/modules/leads/lead-columns";
import { LeadFormDialog } from "@/modules/leads/lead-form-dialog";
import { LEAD_PRIORITY_OPTIONS, LEAD_SOURCE_OPTIONS, LEAD_STATUS_OPTIONS } from "@/modules/leads/lead-options";
import { useCustomers, useExportCustomers } from "@/hooks/use-customers";
import { useDebounce } from "@/hooks/use-debounce";
import type { Customer } from "@/types/entities";

export default function LeadsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [leadSource, setLeadSource] = useState<string>("");
  const debouncedSearch = useDebounce(search);
  const exportCustomers = useExportCustomers();

  const query = {
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: (status || undefined) as never,
    priority: (priority || undefined) as never,
    leadSource: (leadSource || undefined) as never,
  };

  const { data, isLoading } = useCustomers(query);

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Manage leads from first contact through to won or lost"
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline"><Download className="h-4 w-4" /> Export</Button>} />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportCustomers.mutate({ format: "excel", query })}>
                  <FileSpreadsheet className="h-4 w-4" /> Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportCustomers.mutate({ format: "pdf", query })}>
                  <FileText className="h-4 w-4" /> Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <LeadFormDialog
              mode="create"
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> Add Lead
                </Button>
              }
            />
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email, city..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={status || "ALL"} onValueChange={(v) => { setStatus(v === "ALL" || !v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {LEAD_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority || "ALL"} onValueChange={(v) => { setPriority(v === "ALL" || !v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            {LEAD_PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={leadSource || "ALL"} onValueChange={(v) => { setLeadSource(v === "ALL" || !v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sources</SelectItem>
            {LEAD_SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable<Customer>
        columns={leadColumns}
        data={data?.items ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/leads/${row.id}`)}
        emptyLabel="No leads found. Try adjusting your filters or add a new lead."
      />
    </div>
  );
}
