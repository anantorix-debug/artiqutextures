"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORICAL_COLORS } from "@/lib/chart-colors";
import { formatStatusLabel } from "@/lib/format";

export function StatusDonutChart({
  title,
  data,
  loading,
  formatLabel = formatStatusLabel,
}: {
  title: string;
  data: { status: string; count: number }[];
  loading?: boolean;
  formatLabel?: (status: string) => string;
}) {
  const chartData = data.filter((d) => d.count > 0).map((d) => ({ name: formatLabel(d.status), value: d.count }));
  const isEmpty = chartData.length === 0;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                strokeWidth={2}
                stroke="var(--card)"
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) => <span className="text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
