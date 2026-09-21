"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink, FileText, Globe, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentsPanel } from "@/modules/payments/payments-panel";
import { Metric } from "./tab-kit";
import { PublishGalleryDialog } from "./publish-gallery-dialog";
import { useColors, usePaymentMutations, useProjectGalleryEntry, useProjectPayments, useProjectSummary } from "@/hooks/use-project-management";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { ProjectTracking } from "@/types/entities";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function OverviewTab({ project }: { project: ProjectTracking }) {
  const { data: summary } = useProjectSummary(project.id);
  const { data: payments, isLoading: paymentsLoading } = useProjectPayments(project.id);
  const { data: colors } = useColors(project.id);
  const { data: galleryEntry } = useProjectGalleryEntry(project.id);
  const paymentMutations = usePaymentMutations(project.id);
  const [publishOpen, setPublishOpen] = useState(false);

  const profit = summary?.estimatedProfit ?? 0;
  const completed = project.status === "COMPLETED";
  const q = project.quotation;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Project value" value={formatCurrency(summary?.projectValue)} hint="Quotation grand total" />
          <Metric label="Expenses" value={formatCurrency(summary?.totalExpenses)} tone="warn" />
          <Metric label="Estimated profit" value={formatCurrency(profit)} tone={profit < 0 ? "bad" : "good"} />
          <Metric label="Profit margin" value={`${summary?.profitMargin ?? 0}%`} tone={(summary?.profitMargin ?? 0) < 0 ? "bad" : "good"} />
        </div>

        <PaymentsPanel
          summary={payments}
          loading={paymentsLoading}
          adding={paymentMutations.add.isPending}
          onAdd={(values, done) => paymentMutations.add.mutate(values, { onSuccess: done })}
          onRemove={(id) => paymentMutations.remove.mutate(id)}
        />

        {(summary?.expensesByCategory.length ?? 0) > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Where the money went</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary!.expensesByCategory
                .slice()
                .sort((a, b) => b.total - a.total)
                .map((c) => {
                  const pct = summary!.totalExpenses > 0 ? (c.total / summary!.totalExpenses) * 100 : 0;
                  return (
                    <div key={c.category}>
                      <div className="mb-0.5 flex justify-between text-xs">
                        <span className="capitalize">{c.category.toLowerCase()}</span>
                        <span className="text-muted-foreground">{formatCurrency(c.total)} · {Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        )}

        {(colors?.length ?? 0) > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Palette className="h-4 w-4" /> Colors used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {colors!.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs">
                    <span className="h-5 w-5 rounded-full border" style={{ background: c.hexCode }} />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.hexCode.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        {q && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" /> Quotation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/quotations/${q.id}`} className="inline-flex items-center gap-1.5 text-base font-semibold hover:underline">
                {q.quotationNumber} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Row label="Status" value={<StatusBadge status={q.status} />} />
              <Row label="Date" value={formatDate(q.quotationDate)} />
              <Row label="Grand total" value={formatCurrency(q.grandTotal)} />
              <div className="flex gap-2 pt-1">
                <Link href={`/quotations/${q.id}/preview`} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                  Preview / PDF
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4" /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Start date" value={formatDate(project.startDate)} />
            <Row label="Expected completion" value={formatDate(project.expectedCompletionDate)} />
            <Row label="Actual completion" value={formatDate(project.actualCompletionDate)} />
            <Row label="Current stage" value={project.currentStage || "—"} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" /> Team &amp; site
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Customer" value={project.customer?.customerName ?? "—"} />
            <Row label="City" value={project.customer?.city ?? "—"} />
            <Row label="Assigned team" value={project.assignedTeam || "—"} />
            <Row label="Materials / photos" value={`${formatNumber(summary?.materialCount ?? 0)} / ${formatNumber(summary?.photoCount ?? 0)}`} />
            {project.remarks && (
              <p className="border-t pt-2 text-sm text-muted-foreground">{project.remarks}</p>
            )}
          </CardContent>
        </Card>

        <Card className={completed ? "border-emerald-200 bg-emerald-50/50 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/5" : "shadow-sm"}>
          <CardContent className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="h-4 w-4" /> Gallery
            </p>
            {galleryEntry ? (
              <p className="text-xs text-muted-foreground">Published as “{galleryEntry.title}”. Materials, colors and photos are included.</p>
            ) : completed ? (
              <p className="text-xs text-muted-foreground">This project is complete — showcase it in your gallery in one click.</p>
            ) : (
              <p className="text-xs text-muted-foreground">Available once the project is marked Completed.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!completed} onClick={() => setPublishOpen(true)}>
                <Globe className="h-3.5 w-3.5" /> {galleryEntry ? "Update gallery entry" : "Publish to Gallery"}
              </Button>
              {galleryEntry && (
                <Link href="/gallery" className="inline-flex h-7 items-center text-xs text-muted-foreground hover:underline">
                  View in Gallery
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {publishOpen && <PublishGalleryDialog project={project} open={publishOpen} onOpenChange={setPublishOpen} />}
    </div>
  );
}
