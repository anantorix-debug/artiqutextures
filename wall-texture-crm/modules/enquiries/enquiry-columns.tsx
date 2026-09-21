"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Phone, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/format";
import type { Customer } from "@/types/entities";

export const enquiryColumns: ColumnDef<Customer, unknown>[] = [
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <Link href={`/leads/${row.original.id}`} className="block hover:underline">
        <p className="font-medium">{row.original.customerName}</p>
      </Link>
    ),
  },
  {
    accessorKey: "phone",
    header: "Contact",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Phone className="h-3.5 w-3.5" /> {row.original.phone}
      </div>
    ),
  },
  {
    accessorKey: "requirement",
    header: "Enquiry",
    cell: ({ row }) => (
      <p className="max-w-xs truncate text-sm text-muted-foreground" title={row.original.requirement ?? undefined}>
        {row.original.requirement || "-"}
      </p>
    ),
  },
  {
    accessorKey: "referredBy",
    header: "Via",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.referredBy ? "Referral form" : "Contact / Gallery request"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Received",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" /> {formatDateTime(row.original.createdAt)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];
