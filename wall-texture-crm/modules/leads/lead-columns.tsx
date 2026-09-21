"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Phone, MapPin, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatStatusLabel } from "@/lib/format";
import type { Customer } from "@/types/entities";

export const leadColumns: ColumnDef<Customer, unknown>[] = [
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <Link href={`/leads/${row.original.id}`} className="block hover:underline">
        <p className="font-medium">{row.original.customerName}</p>
        {row.original.companyName && (
          <p className="text-xs text-muted-foreground">{row.original.companyName}</p>
        )}
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
    accessorKey: "city",
    header: "Location",
    cell: ({ row }) =>
      row.original.city ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {row.original.city}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "leadSource",
    header: "Source",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatStatusLabel(row.original.leadSource)}</span>,
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => <StatusBadge status={row.original.priority} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "followUpDate",
    header: "Follow-up",
    cell: ({ row }) =>
      row.original.followUpDate ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" /> {formatDate(row.original.followUpDate)}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
];
