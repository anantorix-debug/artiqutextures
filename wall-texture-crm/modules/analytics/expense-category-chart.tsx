"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORICAL_COLORS, CHART_INK } from "@/lib/chart-colors";
import { formatCurrency, formatStatusLabel } from "@/lib/format";

const compact = (n: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function ExpenseCategoryChart({
  data,
  loading,
}: {
  data: { category: string; total: number }[];
  loading?: boolean;
}) {
  const rows = data
    .filter((d) => d.total > 0)
    .map((d) => ({ name: formatStatusLabel(d.category), total: d.total }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            No expenses recorded yet — add them under a project’s Expenses tab.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 16 }}>
              <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: CHART_INK.muted, fontSize: 11 }} tickFormatter={(v) => `₹${compact(v)}`} />
              <YAxis type="category" dataKey="name" width={104} tickLine={false} axisLine={false} tick={{ fill: CHART_INK.secondary, fontSize: 11 }} />
              <Tooltip formatter={(v) => [formatCurrency(v as number), "Spent"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={16}>
                {rows.map((_, i) => (
                  <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
