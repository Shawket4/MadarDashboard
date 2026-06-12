import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";
import { BarChart2 } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatCard } from "@/shared/ui/stat-card";
import { ChartTooltip } from "@/shared/ui/chart-tooltip";
import { useBranchSales, useBranchSalesTimeseries as useBranchTimeseries } from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { fmtPeriod } from "@/shared/lib/format";
import { exportToExcel,  } from "@/shared/lib/excel";
import type { TimeseriesPoint } from "@/shared/types";
import { ChartCard } from "./chart-card";

type Granularity = "hourly" | "daily" | "monthly";


export function RevenueTab({
  branchId, from, to, granularity,
}: {
  branchId: string;
  from: string | null;
  to: string | null;
  granularity: Granularity;
}) {
  const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ void i18n.language;
  const { activeMethods, getLabel, colorMap } = usePaymentMethods();
  const { data: ts = [], isLoading } = useBranchTimeseries(branchId, { from: from ?? undefined, to: to ?? undefined, granularity }, { query: { enabled: !!branchId } });
  const { data: sales } = useBranchSales(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });

  const chartData = useMemo(
    () => ts.map((p) => {
      const base: Record<string, any> = {
        ...p,
        period: fmtPeriod(p.period, granularity),
      };
      const byMethod = (p.revenue_by_method as Record<string, number>) || {};
      for (const m of activeMethods) {
        base[`${m.name}_revenue`] = byMethod[m.name] ?? 0;
      }
      return base;
    }),
    [ts, granularity, activeMethods],
  );

  const handleExport = () =>
    exportToExcel({
      filename: `Revenue-${granularity}`,
      sheets: [{
        name: "Timeseries",
        title: `${t("analytics.revenueOverTime")} (${t(`analytics.granularity.${granularity}`)})`,
        columns: [
          { key: "period", header: t("common.time"), accessor: (p: TimeseriesPoint) => fmtPeriod(p.period, granularity), width: 22 },
          { key: "orders", header: t("dashboard.orders"), accessor: (p: TimeseriesPoint) => p.orders, type: "integer", width: 12, total: true },
          { key: "revenue", header: t("orders.totalRevenue"), accessor: (p: TimeseriesPoint) => p.revenue, type: "money", width: 16, total: true },
          { key: "voided", header: t("orderStatus.voided"), accessor: (p: TimeseriesPoint) => p.voided, type: "integer", width: 12, total: true },
          ...activeMethods.map((m) => ({
            key: m.name,
            header: getLabel(m.name),
            accessor: (p: TimeseriesPoint) => (p.revenue_by_method as Record<string, number>)?.[m.name] ?? 0,
            type: "money" as const,
            width: 14,
            total: true,
          })),
        ],
        rows: ts,
        totals: true,
      }],
    });

  if (isLoading) return <Skeleton className="h-[360px] rounded-xl" />;
  if (chartData.length === 0) return <EmptyState icon={BarChart2} title={t("analytics.noData")} />;

  return (
    <div className="space-y-4">
      {sales && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <StatCard label={t("orders.totalRevenue")} value={sales.total_revenue} formatType="money" accent="success" />
          <StatCard label={t("orders.totalDiscounts")} value={sales.total_discount} formatType="money" accent="warning" />
          <StatCard label={t("orders.tax")} value={sales.total_tax} formatType="money" accent="info" />
          <StatCard label={t("orders.totalRevenue") + " (net)"} value={sales.subtotal} formatType="money" accent="violet" />
        </div>
      )}

      {/*
       * Revenue Over Time — the one chart styled after the original dashboard.
       *
       * Each payment method renders as its own <Area>, drawn on top of the
       * previous one with a semi-transparent gradient fill. Where areas
       * overlap, the fills blend visually — no stacking, no aggregation.
       * Talabat Online and Talabat Cash stay split per the business rule.
       *
       * The gradient goes from 0.55 opacity at the top to 0.15 at the bottom
       * (rather than fading to 0) so the fills are actually visible. At 0.15
       * the overlapped regions mix their colors visibly.
       */}
      <ChartCard title={t("analytics.revenueOverTime")} onExport={handleExport}>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              {activeMethods.map((m) => (
                <linearGradient key={m.name} id={`grad-${m.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorMap[m.name] || "#ccc"} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={colorMap[m.name] || "#ccc"} stopOpacity={0.15} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} reversed={i18n.dir() === "rtl"} />
            <YAxis tickFormatter={(v) => `${(v / 100).toFixed(0)}`} tick={{ fontSize: 11 }} orientation={i18n.dir() === "rtl" ? "right" : "left"} />
            <ReTooltip content={<ChartTooltip valueFormat="money" />} />
            <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
            {activeMethods.map((m) => (
              <Area
                key={m.name}
                type="monotone"
                dataKey={`${m.name}_revenue`}
                name={getLabel(m.name)}
                stroke={colorMap[m.name] || "#ccc"}
                strokeWidth={2}
                fill={`url(#grad-${m.name})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Items Tab — table + categories + addon sales (clean card-based)
// ─────────────────────────────────────────────────────────────────────────────
