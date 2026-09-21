"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProjectUpdateForm } from "./project-update-form";
import { OverviewTab } from "./overview-tab";
import { ExpensesTab } from "./expenses-tab";
import { MaterialsTab } from "./materials-tab";
import { ColorsTab } from "./colors-tab";
import { PhotosTab } from "./photos-tab";
import { DocumentsTab } from "./documents-tab";
import { ActivityTab } from "./activity-tab";
import { useProject } from "@/hooks/use-tracking";

const TABS = [
  ["overview", "Overview"],
  ["progress", "Progress"],
  ["expenses", "Expenses"],
  ["materials", "Materials"],
  ["colors", "Colors"],
  ["photos", "Photos"],
  ["documents", "Documents"],
  ["activity", "Activity"],
] as const;

export function TrackingDetailClient({ id }: { id: string }) {
  const { data: project, isLoading, isError } = useProject(id);
  const [tab, setTab] = useState<string>("overview");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !project) {
    return (
      <div>
        <Link href="/tracking" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Project Tracking
        </Link>
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="py-10 text-center text-sm text-destructive">This project could not be found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link href="/tracking" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Project Tracking
      </Link>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-xl font-semibold">{project.projectName}</h1>
            <StatusBadge status={project.status} kind="project" />
            {project.galleryEntry && !project.galleryEntry.deletedAt && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
                <Globe className="h-3 w-3" /> In gallery
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{project.customer?.customerName}</p>
        </div>
        {project.quotation && (
          <Link
            href={`/quotations/${project.quotation.id}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm shadow-sm hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            <span className="text-muted-foreground">Quotation</span> {project.quotation.quotationNumber}
          </Link>
        )}
      </div>

      <Card className="mb-5 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Progress value={project.progressPercentage} className="h-2 min-w-[120px] flex-1" />
          <span className="text-sm font-medium">{project.progressPercentage}%</span>
          {project.currentStage && <span className="text-sm text-muted-foreground">· {project.currentStage}</span>}
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <TabsList className="!h-9 w-max min-w-full sm:min-w-0">
            {TABS.map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="px-3">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-5">
          <OverviewTab project={project} />
        </TabsContent>
        <TabsContent value="progress" className="mt-5">
          <div className="max-w-3xl">
            <ProjectUpdateForm key={project.updatedAt} project={project} />
          </div>
        </TabsContent>
        <TabsContent value="expenses" className="mt-5">
          <ExpensesTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="materials" className="mt-5">
          <MaterialsTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="colors" className="mt-5">
          <ColorsTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="photos" className="mt-5">
          <PhotosTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="documents" className="mt-5">
          <DocumentsTab project={project} />
        </TabsContent>
        <TabsContent value="activity" className="mt-5">
          <ActivityTab projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
