"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import type { ProjectTracking } from "@/types/entities";

export const trackingColumns: ColumnDef<ProjectTracking, unknown>[] = [
  {
    accessorKey: "projectName",
    header: "Project",
    cell: ({ row }) => (
      <Link href={`/tracking/${row.original.id}`} className="hover:underline">
        <p className="font-medium">{row.original.projectName}</p>
        <p className="text-xs text-muted-foreground">{row.original.customer?.customerName}</p>
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} kind="project" />,
  },
  {
    accessorKey: "progressPercentage",
    header: "Progress",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Progress value={row.original.progressPercentage} className="h-1.5 w-24" />
        <span className="text-xs text-muted-foreground">{row.original.progressPercentage}%</span>
      </div>
    ),
  },
  {
    accessorKey: "assignedTeam",
    header: "Assigned Team",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.assignedTeam || "-"}</span>,
  },
  {
    accessorKey: "expectedCompletionDate",
    header: "Expected Completion",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.original.expectedCompletionDate)}</span>
    ),
  },
];
