"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORICAL_COLORS, CHART_INK } from "@/lib/chart-colors";

export function GrowthChart({
  data,
  loading,
}: {
  data: { month: string; count: number }[];
  loading?: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Customer Growth</CardTitle>
      </CardHeader>
      <CardContent className="h-72 px-2">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                width={32}
                allowDecimals={false}
                tick={{ fill: CHART_INK.muted, fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [value as number, "New Leads"]}
                contentStyle={{ borderRadius: 8, borderColor: CHART_INK.grid, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={CATEGORICAL_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 3, fill: CATEGORICAL_COLORS[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
