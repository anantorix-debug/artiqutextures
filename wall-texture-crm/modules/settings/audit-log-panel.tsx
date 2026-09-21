"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuditLogs } from "@/hooks/use-settings";
import { formatDateTime, formatStatusLabel } from "@/lib/format";
import type { AuditLog } from "@/types/entities";

const columns: ColumnDef<AuditLog, unknown>[] = [
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => <StatusBadge status={row.original.action} />,
  },
  {
    accessorKey: "module",
    header: "Module",
    cell: ({ row }) => <span className="text-sm">{formatStatusLabel(row.original.module)}</span>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <p className="max-w-md truncate text-sm text-muted-foreground">
        {row.original.description || `${row.original.entityType ?? ""} ${row.original.entityId ?? ""}`}
      </p>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
  },
];

export function AuditLogPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs({ page, limit: 15 });

  return (
    <DataTable<AuditLog>
      columns={columns}
      data={data?.items ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      onPageChange={setPage}
      emptyLabel="No audit activity recorded yet"
    />
  );
}
