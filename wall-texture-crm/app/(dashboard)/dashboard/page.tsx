"use client";

import {
  Users,
  UserPlus,
  Clock,
  FileClock,
  FileCheck2,
  FileX2,
  HardHat,
  CheckCircle2,
  IndianRupee,
  MessageCircle,
  Images,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useDashboardCards, useDashboardCharts } from "@/hooks/use-dashboard";
import { RevenueChart } from "@/modules/dashboard/revenue-chart";
import { GrowthChart } from "@/modules/dashboard/growth-chart";
import { StatusDonutChart } from "@/modules/dashboard/status-donut-chart";
import { RecentActivities } from "@/modules/dashboard/recent-activities";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function DashboardPage() {
  const { data: cards, isLoading: cardsLoading } = useDashboardCards();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of leads, quotations, projects and revenue" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Total Leads" value={formatNumber(cards?.totalLeads)} icon={Users} loading={cardsLoading} />
        <StatCard label="Today's Leads" value={formatNumber(cards?.todaysLeads)} icon={UserPlus} loading={cardsLoading} accent="success" />
        <StatCard
          label="Pending Follow-ups"
          value={formatNumber(cards?.pendingFollowUps)}
          icon={Clock}
          loading={cardsLoading}
          accent="warning"
        />
        <StatCard
          label="Pending Quotations"
          value={formatNumber(cards?.pendingQuotations)}
          icon={FileClock}
          loading={cardsLoading}
          accent="warning"
        />
        <StatCard
          label="Approved Quotations"
          value={formatNumber(cards?.approvedQuotations)}
          icon={FileCheck2}
          loading={cardsLoading}
          accent="success"
        />
        <StatCard
          label="Rejected Quotations"
          value={formatNumber(cards?.rejectedQuotations)}
          icon={FileX2}
          loading={cardsLoading}
          accent="danger"
        />
        <StatCard label="Ongoing Projects" value={formatNumber(cards?.ongoingProjects)} icon={HardHat} loading={cardsLoading} />
        <StatCard
          label="Completed Projects"
          value={formatNumber(cards?.completedProjects)}
          icon={CheckCircle2}
          loading={cardsLoading}
          accent="success"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(cards?.monthlyRevenue)}
          icon={IndianRupee}
          loading={cardsLoading}
          accent="success"
        />
        <StatCard
          label="WhatsApp Status"
          value={cards?.whatsappConnected ? "Connected" : "Disconnected"}
          icon={MessageCircle}
          loading={cardsLoading}
          accent={cards?.whatsappConnected ? "success" : "danger"}
        />
        <StatCard label="Gallery Images" value={formatNumber(cards?.galleryImages)} icon={Images} loading={cardsLoading} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={charts?.monthlyRevenue ?? []} loading={chartsLoading} />
        </div>
        <GrowthChart data={charts?.customerGrowth ?? []} loading={chartsLoading} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusDonutChart title="Lead Conversion" data={charts?.leadConversion ?? []} loading={chartsLoading} />
        <StatusDonutChart title="Quotation Status" data={charts?.quotationStatus ?? []} loading={chartsLoading} />
        <StatusDonutChart title="Project Status" data={charts?.projectStatus ?? []} loading={chartsLoading} />
      </div>

      <div className="mt-4">
        <RecentActivities />
      </div>
    </div>
  );
}
