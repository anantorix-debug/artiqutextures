"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useRecentActivities } from "@/hooks/use-dashboard";

export function RecentActivities() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useRecentActivities();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activities = data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <ul className="space-y-4">
              {activities.map((activity) => (
                <li key={activity.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {activity.customer ? (
                        <Link href={`/leads/${activity.customer.id}`} className="hover:underline">
                          {activity.customer.customerName}
                        </Link>
                      ) : null}{" "}
                      <span className="font-normal text-muted-foreground">— {activity.title}</span>
                    </p>
                    {activity.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{activity.description}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(activity.activityDate)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div ref={sentinelRef} className="flex justify-center py-3">
              {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!hasNextPage && activities.length > 0 && (
                <span className="text-xs text-muted-foreground">No more activity</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
