"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Quotation } from "@/types/entities";

export const quotationColumns: ColumnDef<Quotation, unknown>[] = [
  {
    accessorKey: "quotationNumber",
    header: "Quotation #",
    cell: ({ row }) => (
      <Link href={`/quotations/${row.original.id}`} className="hover:underline">
        <p className="font-medium">{row.original.quotationNumber}</p>
        <p className="text-xs text-muted-foreground">{row.original.projectName}</p>
      </Link>
    ),
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <p className="text-sm">{row.original.customer?.customerName}</p>
        <p className="text-xs text-muted-foreground">{row.original.customer?.phone}</p>
      </div>
    ),
  },
  {
    accessorKey: "quotationDate",
    header: "Date",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.quotationDate)}</span>,
  },
  {
    accessorKey: "grandTotal",
    header: "Amount",
    cell: ({ row }) => <span className="text-sm font-medium">{formatCurrency(row.original.grandTotal)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">v{row.original.version}</span>,
  },
];
