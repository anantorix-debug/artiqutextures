"use client";

import {
  BadgeIndianRupee,
  Boxes,
  CheckCircle2,
  Flag,
  Globe,
  History,
  Images,
  Palette,
  PlayCircle,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { EmptyState, TabError, TabLoading } from "./tab-kit";
import { useProjectActivities } from "@/hooks/use-project-management";
import { formatDateTime } from "@/lib/format";

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  PROJECT_CREATED: { icon: Sparkles, tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  PROJECT_STARTED: { icon: PlayCircle, tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400" },
  PROJECT_COMPLETED: { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  PROGRESS_CHANGED: { icon: TrendingUp, tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  STAGE_CHANGED: { icon: Flag, tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  STATUS_CHANGED: { icon: Flag, tone: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300" },
  TEAM_CHANGED: { icon: Users, tone: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300" },
  REMARKS_UPDATED: { icon: History, tone: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300" },
  EXPENSE: { icon: Receipt, tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" },
  MATERIAL: { icon: Boxes, tone: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400" },
  COLOR: { icon: Palette, tone: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-400" },
  PHOTO: { icon: Images, tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400" },
  PAYMENT: { icon: BadgeIndianRupee, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  GALLERY: { icon: Globe, tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400" },
};

function iconFor(type: string) {
  if (ICONS[type]) return ICONS[type];
  const prefix = Object.keys(ICONS).find((k) => type.startsWith(k));
  return prefix ? ICONS[prefix] : { icon: History, tone: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300" };
}

export function ActivityTab({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useProjectActivities(projectId);

  if (isLoading) return <TabLoading rows={4} />;
  if (isError || !data) return <TabError />;
  if (data.length === 0) {
    return <EmptyState icon={History} title="No activity yet" hint="Changes to progress, expenses, materials, colors, photos and payments are logged here." />;
  }

  return (
    <ol className="relative ml-4 space-y-5 border-l pl-6">
      {data.map((a) => {
        const { icon: Icon, tone } = iconFor(a.type);
        return (
          <li key={a.id} className="relative">
            <span className={`absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${tone}`}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-sm font-medium">{a.title}</p>
            {a.description && <p className="break-words text-xs text-muted-foreground">{a.description}</p>}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTime(a.createdAt)}
              {a.userName ? ` · ${a.userName}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
