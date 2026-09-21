"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export function useDashboardCards() {
  return useQuery({ queryKey: ["dashboard", "cards"], queryFn: dashboardService.getCards });
}

export function useDashboardCharts() {
  return useQuery({ queryKey: ["dashboard", "charts"], queryFn: dashboardService.getCharts });
}

export function useRecentActivities() {
  return useInfiniteQuery({
    queryKey: ["dashboard", "recent-activities"],
    queryFn: ({ pageParam }) => dashboardService.getRecentActivities(pageParam, 15),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined),
  });
}
