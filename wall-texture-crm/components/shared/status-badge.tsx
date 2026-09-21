import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatStatusLabel } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  // Leads
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  CONTACTED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  SITE_VISIT_SCHEDULED: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  SITE_VISIT_DONE: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  QUOTATION_SENT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  NEGOTIATION: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  WON: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  ON_HOLD: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  // Quotations
  DRAFT: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  SENT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  VIEWED: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  EXPIRED: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  CONVERTED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  // Projects
  PENDING: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  STARTED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  // Priority
  LOW: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  // WhatsApp / generic
  CONNECTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  DISCONNECTED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  QR_PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  INITIALIZING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  AUTH_FAILED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  QUEUED: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  READ: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  INACTIVE: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  SUCCESS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

/** Labels that differ from the auto-generated Title Case of the enum value. */
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Not Started",
};

export function StatusBadge({ status, className, kind }: { status: string; className?: string; kind?: "project" }) {
  return (
    <Badge className={cn("border-0 font-medium", STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT, className)}>
      {kind === "project" ? (STATUS_LABELS[status] ?? formatStatusLabel(status)) : formatStatusLabel(status)}
    </Badge>
  );
}
