"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_INK, SEQUENTIAL_BLUE } from "@/lib/chart-colors";
import { formatCurrency } from "@/lib/format";

export function RevenueChart({
  data,
  loading,
}: {
  data: { month: string; total: number }[];
  loading?: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent className="h-72 px-2">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SEQUENTIAL_BLUE[2]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SEQUENTIAL_BLUE[2]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: CHART_INK.axis }}
                tick={{ fill: CHART_INK.muted, fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: CHART_INK.muted, fontSize: 11 }}
                width={64}
                tickFormatter={(v: number) => formatCurrency(v).replace("₹", "₹ ")}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                contentStyle={{ borderRadius: 8, borderColor: CHART_INK.grid, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={SEQUENTIAL_BLUE[2]}
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
