"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORICAL_COLORS, CHART_INK } from "@/lib/chart-colors";
import type { RequestedTexture } from "@/services/analytics.service";

export function TextureBarChart({ data, loading }: { data: RequestedTexture[]; loading?: boolean }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Most Requested Texture</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: CHART_INK.muted, fontSize: 11 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="productName"
                width={140}
                tickLine={false}
                axisLine={false}
                tick={{ fill: CHART_INK.secondary, fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => [value as number, name === "timesQuoted" ? "Times Quoted" : name]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="timesQuoted" fill={CATEGORICAL_COLORS[0]} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
