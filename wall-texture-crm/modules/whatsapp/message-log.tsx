"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useWhatsappMessages } from "@/hooks/use-whatsapp";
import { formatDateTime, formatStatusLabel } from "@/lib/format";
import type { WhatsAppMessage } from "@/types/entities";

const columns: ColumnDef<WhatsAppMessage, unknown>[] = [
  {
    accessorKey: "direction",
    header: "",
    cell: ({ row }) =>
      row.original.direction === "OUTBOUND" ? (
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
      ),
  },
  {
    accessorKey: "customer",
    header: "Contact",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.customer?.customerName ?? row.original.toNumber}</p>
        <p className="text-xs text-muted-foreground">{row.original.toNumber}</p>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatStatusLabel(row.original.type)}</span>,
  },
  {
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => (
      <p className="max-w-xs truncate text-sm">{row.original.content || row.original.fileName || "-"}</p>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
  },
];

export function MessageLog() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useWhatsappMessages({ page, limit: 10 });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Message Log</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<WhatsAppMessage>
          columns={columns}
          data={data?.items ?? []}
          meta={data?.meta}
          isLoading={isLoading}
          onPageChange={setPage}
          emptyLabel="No WhatsApp messages sent yet"
        />
      </CardContent>
    </Card>
  );
}
