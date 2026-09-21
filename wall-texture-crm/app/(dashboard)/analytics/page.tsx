"use client";

import {
  TrendingUp,
  Percent,
  Clock,
  MessageCircle,
  Download,
  FileSpreadsheet,
  FileText,
  ClipboardList,
  CheckCircle2,
  BadgeIndianRupee,
  Briefcase,
  Receipt,
  PiggyBank,
  Gauge,
  HardHat,
  Trophy,
  Hourglass,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RevenueChart } from "@/modules/dashboard/revenue-chart";
import { StatusDonutChart } from "@/modules/dashboard/status-donut-chart";
import { TextureBarChart } from "@/modules/analytics/texture-bar-chart";
import { ExpenseCategoryChart } from "@/modules/analytics/expense-category-chart";
import { formatCurrency, formatProjectStatus } from "@/lib/format";
import {
  useBusinessSummary,
  useExportAnalytics,
  useLeadConversionAnalytics,
  useMonthlySales,
  useMostRequestedTexture,
  useProjectProgressAnalytics,
  useQuotationPerformance,
  useWhatsappStatistics,
} from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const { data: sales, isLoading: salesLoading } = useMonthlySales();
  const { data: conversion, isLoading: conversionLoading } = useLeadConversionAnalytics();
  const { data: performance, isLoading: performanceLoading } = useQuotationPerformance();
  const { data: textures, isLoading: texturesLoading } = useMostRequestedTexture();
  const { data: progress, isLoading: progressLoading } = useProjectProgressAnalytics();
  const { data: whatsappStats, isLoading: whatsappLoading } = useWhatsappStatistics();
  const { data: biz, isLoading: bizLoading } = useBusinessSummary();
  const exportAnalytics = useExportAnalytics();

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Business performance, profitability, sales and conversion"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline"><Download className="h-4 w-4" /> Export</Button>} />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportAnalytics.mutate("excel")}>
                <FileSpreadsheet className="h-4 w-4" /> Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAnalytics.mutate("pdf")}>
                <FileText className="h-4 w-4" /> Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Business overview</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Quotations" value={biz?.totalQuotations ?? 0} icon={ClipboardList} loading={bizLoading} />
        <StatCard
          label="Approved Quotations"
          value={biz?.approvedQuotations ?? 0}
          icon={CheckCircle2}
          loading={bizLoading}
          accent="success"
          hint="Approved + converted"
        />
        <StatCard label="Total Quotation Value" value={formatCurrency(biz?.totalQuotationValue)} icon={BadgeIndianRupee} loading={bizLoading} />
        <StatCard label="Total Project Value" value={formatCurrency(biz?.totalProjectValue)} icon={Briefcase} loading={bizLoading} hint="Active + completed projects" />
        <StatCard label="Total Expenses" value={formatCurrency(biz?.totalExpenses)} icon={Receipt} loading={bizLoading} accent="warning" />
        <StatCard
          label="Estimated Profit"
          value={formatCurrency(biz?.estimatedProfit)}
          icon={PiggyBank}
          loading={bizLoading}
          accent={(biz?.estimatedProfit ?? 0) < 0 ? "danger" : "success"}
          hint="Project value − expenses"
        />
        <StatCard
          label="Profit Margin"
          value={`${biz?.profitMargin ?? 0}%`}
          icon={Gauge}
          loading={bizLoading}
          accent={(biz?.profitMargin ?? 0) < 0 ? "danger" : "success"}
        />
        <StatCard
          label="Pending Payments"
          value={formatCurrency(biz?.pendingPayments)}
          icon={Hourglass}
          loading={bizLoading}
          accent="warning"
          hint={`${formatCurrency(biz?.totalReceived)} received`}
        />
        <StatCard label="Active Projects" value={biz?.activeProjects ?? 0} icon={HardHat} loading={bizLoading} />
        <StatCard label="Completed Projects" value={biz?.completedProjects ?? 0} icon={Trophy} loading={bizLoading} accent="success" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ExpenseCategoryChart data={biz?.expensesByCategory ?? []} loading={bizLoading} />
        <StatusDonutChart
          title="Project Status Summary"
          data={biz?.projectStatusSummary ?? []}
          loading={bizLoading}
          formatLabel={formatProjectStatus}
        />
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted-foreground">Sales &amp; conversion</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Lead Conversion Rate"
          value={`${conversion?.conversionRate ?? 0}%`}
          icon={TrendingUp}
          loading={conversionLoading}
          hint={`${conversion?.won ?? 0} of ${conversion?.total ?? 0} leads won`}
          accent="success"
        />
        <StatCard
          label="Quotation Approval Rate"
          value={`${performance?.approvalRate ?? 0}%`}
          icon={Percent}
          loading={performanceLoading}
        />
        <StatCard
          label="Avg Approval Turnaround"
          value={`${performance?.avgApprovalTurnaroundDays ?? 0}d`}
          icon={Clock}
          loading={performanceLoading}
        />
        <StatCard
          label="WhatsApp Delivery Rate"
          value={`${whatsappStats?.deliveryRate ?? 0}%`}
          icon={MessageCircle}
          loading={whatsappLoading}
          hint={`${whatsappStats?.failed ?? 0} failed`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={sales?.map((s) => ({ month: s.month, total: s.total })) ?? []} loading={salesLoading} />
        </div>
        <StatusDonutChart title="Lead Status Breakdown" data={conversion?.byStatus ?? []} loading={conversionLoading} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TextureBarChart data={textures ?? []} loading={texturesLoading} />
        <StatusDonutChart
          title="Quotation Performance"
          data={performance?.byStatus.map((s) => ({ status: s.status, count: s.count })) ?? []}
          loading={performanceLoading}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusDonutChart
          title="Project Progress by Status"
          data={progress?.byStatus.map((s) => ({ status: s.status, count: s.count })) ?? []}
          loading={progressLoading}
          formatLabel={formatProjectStatus}
        />
        <StatusDonutChart
          title="WhatsApp Messages by Type"
          data={whatsappStats?.byType.map((s) => ({ status: s.type, count: s.count })) ?? []}
          loading={whatsappLoading}
        />
      </div>
    </div>
  );
}
