// Reports ▸ Financial's Revenue and Channel tabs. They share the Operations
// report's card kit (report-kit), so both reports load, fail and empty alike.
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { DataTable } from "@/components/app/data-table";
import { SegmentedControl } from "@/components/app/segmented-control";
import type { ColumnDef } from "@tanstack/react-table";
import { Stagger, useChartMotion } from "@/lib/motion";
import { fmtHour, fmtPercent, fmtMoney, fmtMoneyCompact, fmtNumber, fmtPeriod } from "@/lib/format";
import { PAYMENT_COLORS, type PaymentMethod } from "@/data/config/constants";
import {
  useBranchChannelBreakdown, useBranchSalesPeakDays, useBranchSalesPeakHours, useBranchSalesTimeseries,
} from "@/data/api/generated/api";
import type { PeakDayPoint, PeakHourPoint, TimeseriesPoint } from "@/data/api/generated/models";
import { WEEKDAYS } from "@/features/staff/util";
import {
  CHART_GRID, ChartEmpty, ChartError, ChartFrame, ChartSkeleton,
} from "@/features/reports/operations/report-kit";
import { GRANULARITIES, type Granularity, type MethodMap, type Range } from "./lib";

export type { Range };

const AXIS = CHART_AXIS_TICK;
const grid = CHART_GRID;


// Peak-hours / peak-days tooltip — avg/bucket, share of total, period total,
// and (regardless of which of revenue/orders is charted) orders, line items
// and add-ons sold in that bucket.
function PeakTooltip({ active, payload, type }: {
  active?: boolean;
  payload?: { payload: (PeakHourPoint | PeakDayPoint) & { label: string } }[];
  type: "revenue" | "orders";
}) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const isRevenue = type === "revenue";
  const avgVal    = isRevenue ? fmtMoney(p.avg_revenue_per_day) : fmtNumber(p.avg_orders_per_day, { maximumFractionDigits: 1 });
  const totalVal  = isRevenue ? fmtMoney(p.revenue)             : fmtNumber(p.orders);
  const pct       = isRevenue ? p.revenue_pct                   : p.orders_pct;
  return (
    <div className="min-w-48 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {p.label ? <div className="mb-1.5 font-medium text-foreground">{p.label}</div> : null}
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("analytics.avgPerDay", "Avg / Day")}</span>
        <span className="font-semibold tabular text-foreground">{avgVal}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("analytics.shareOfTotal", "Share")}</span>
        <span className="tabular text-foreground">{fmtPercent(pct / 100)}</span>
      </div>
      <div className="mt-1.5 border-t pt-1.5 flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("analytics.periodTotal", "Period Total")}</span>
        <span className="tabular text-muted-foreground">{totalVal}</span>
      </div>
      <div className="mt-1.5 border-t pt-1.5 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("dashboard.orders", "Orders")}</span>
          <span className="tabular text-foreground">{fmtNumber(p.orders)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("analytics.itemsSold", "Items Sold")}</span>
          <span className="tabular text-foreground">{fmtNumber(p.line_items)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("analytics.addonsSold", "Add-ons Sold")}</span>
          <span className="tabular text-foreground">{fmtNumber(p.addons)}</span>
        </div>
      </div>
    </div>
  );
}

// Revenue tooltip — per-payment-method breakdown for the hovered period.
function RevenueSplitTooltip({ active, payload }: { active?: boolean; payload?: { payload: TimeseriesPoint & { label?: string } }[] }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const methods = Object.entries((point.revenue_by_method ?? {}) as MethodMap)
    .map(([method, v]) => ({ method, value: Number(v) || 0 }))
    .filter((m) => m.value > 0)
    .sort((a, b) => b.value - a.value);
  return (
    <div className="min-w-44 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {point.label ? <div className="mb-1.5 font-medium text-foreground">{point.label}</div> : null}
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("dashboard.revenue", "Revenue")}</span>
        <span className="font-semibold tabular text-foreground">{fmtMoney(point.revenue)}</span>
      </div>
      {methods.length ? (
        <div className="mt-1.5 space-y-1 border-t pt-1.5">
          {methods.map((m) => (
            <div key={m.method} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: PAYMENT_COLORS[m.method as PaymentMethod] ?? "var(--muted-foreground)" }} />
              <span className="text-muted-foreground">{t(`payments.${m.method}`, m.method)}</span>
              <span className="ms-auto font-medium tabular text-foreground">{fmtMoney(m.value)}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-1.5 space-y-1 border-t pt-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("dashboard.orders", "Orders")}</span>
          <span className="tabular text-foreground">{fmtNumber(point.orders)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("analytics.itemsSold", "Items Sold")}</span>
          <span className="tabular text-foreground">{fmtNumber(point.line_items)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("analytics.addonsSold", "Add-ons Sold")}</span>
          <span className="tabular text-foreground">{fmtNumber(point.addons)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Revenue (timeseries + peak hours) ───────────────────────────────────────
export function RevenueTab({ branchId, range, gran, setGran }: { branchId: string; range: Range; gran: Granularity; setGran: (g: Granularity) => void }) {
  const { t } = useTranslation();
  const chartMotion = useChartMotion();
  const isPeak = gran === "peak_hours" || gran === "peak_days";

  const tsQ = useBranchSalesTimeseries(branchId, { ...range, granularity: gran }, { query: { enabled: !!branchId && !isPeak } });
  const tsData = useMemo(() => (tsQ.data ?? []).map((p) => ({ ...p, label: fmtPeriod(p.period, gran) })), [tsQ.data, gran]);

  const phQ = useBranchSalesPeakHours(branchId, range, { query: { enabled: !!branchId && gran === "peak_hours" } });
  const phData = useMemo(() => (phQ.data ?? []).map((p) => ({ ...p, label: fmtHour(p.hour) })), [phQ.data]);

  const pdQ = useBranchSalesPeakDays(branchId, range, { query: { enabled: !!branchId && gran === "peak_days" } });
  const pdData = useMemo(
    () => (pdQ.data ?? []).map((p) => ({
      ...p,
      label: t(WEEKDAYS[p.day_of_week].labelKey, WEEKDAYS[p.day_of_week].fallback),
    })),
    [pdQ.data, t],
  );

  const peakQ = gran === "peak_days" ? pdQ : phQ;
  const peakData = gran === "peak_days" ? pdData : phData;

  const isLoading = isPeak ? peakQ.isLoading : tsQ.isLoading;
  const isError = isPeak ? peakQ.isError : tsQ.isError;

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={gran}
        onChange={setGran}
        options={GRANULARITIES.map((g) => ({ value: g, label: t(`analytics.granularity.${g}`, g) }))}
      />

      <ChartCard title={
        gran === "peak_hours" ? t("analytics.revenueByHour", "Revenue by Hour")
          : gran === "peak_days" ? t("analytics.revenueByWeekday", "Revenue by Day of Week")
            : t("analytics.revenueOverTime", "Revenue Over Time")
      }>
        {isLoading ? <ChartSkeleton /> : isError ? <ChartError className="h-72" onRetry={() => (isPeak ? peakQ.refetch() : tsQ.refetch())} /> : (isPeak ? peakData : tsData).length === 0
          ? <ChartEmpty className="h-72" />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                {isPeak ? (
                  <BarChart data={peakData as Record<string, string | number>[]} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                    {grid}
                    <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={gran === "peak_hours" ? 2 : 0} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                    <Tooltip cursor={{ fill: "var(--muted)" }} content={<PeakTooltip type="revenue" />} />
                    <Bar dataKey="avg_revenue_per_day" name={t("dashboard.revenue", "Revenue")} fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={56} {...chartMotion} />
                  </BarChart>
                ) : gran === "monthly" ? (
                  <BarChart data={tsData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                    {grid}
                    <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                    <Tooltip cursor={{ fill: "var(--muted)" }} content={<RevenueSplitTooltip />} />
                    <Bar dataKey="revenue" name={t("dashboard.revenue", "Revenue")} fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={56} {...chartMotion} />
                  </BarChart>
                ) : (
                  <AreaChart data={tsData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartColor(0)} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={chartColor(0)} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {grid}
                    <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                    <Tooltip content={<RevenueSplitTooltip />} />
                    <Area type="monotone" dataKey="revenue" name={t("dashboard.revenue", "Revenue")} stroke={chartColor(0)} fill="url(#rev)" strokeWidth={2} {...chartMotion} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <Stagger className="grid gap-4 lg:grid-cols-2">
        <div>
          <ChartCard title={
            gran === "peak_hours" ? t("analytics.ordersByHour", "Orders by Hour")
              : gran === "peak_days" ? t("analytics.ordersByWeekday", "Orders by Day of Week")
                : t("analytics.ordersOverTime", "Orders Over Time")
          }>
            {isLoading ? <ChartSkeleton /> : isError ? <ChartError className="h-72" onRetry={() => (isPeak ? peakQ.refetch() : tsQ.refetch())} /> : (isPeak ? peakData : tsData).length === 0
              ? <ChartEmpty className="h-72" />
              : (
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(isPeak ? peakData : tsData) as Record<string, string | number>[]} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                      {grid}
                      <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={gran === "peak_hours" ? 2 : 0} />
                      <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={isPeak} width={36} tickFormatter={isPeak ? (v) => fmtNumber(Number(v), { maximumFractionDigits: 1 }) : undefined} />
                      <Tooltip cursor={{ fill: "var(--muted)" }} content={isPeak ? <PeakTooltip type="orders" /> : <ChartTooltipContent formatter={(v) => fmtNumber(v)} />} />
                      <Bar dataKey={isPeak ? "avg_orders_per_day" : "orders"} name={t("dashboard.orders", "Orders")} fill={chartColor(1)} radius={[4, 4, 0, 0]} maxBarSize={56} {...chartMotion} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              )}
          </ChartCard>
        </div>

        <div>
          <ChartCard title={
            gran === "peak_hours" ? t("analytics.discountsByHour", "Discounts by Hour")
              : gran === "peak_days" ? t("analytics.discountsByWeekday", "Discounts by Day of Week")
                : t("analytics.discountsOverTime", "Discounts Over Time")
          }>
            {isLoading ? <ChartSkeleton /> : isError ? <ChartError className="h-72" onRetry={() => (isPeak ? peakQ.refetch() : tsQ.refetch())} /> : (isPeak ? peakData : tsData).length === 0
              ? <ChartEmpty className="h-72" />
              : (
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    {isPeak ? (
                      <BarChart data={peakData as Record<string, string | number>[]} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                        {grid}
                        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={gran === "peak_hours" ? 2 : 0} />
                        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                        <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                        <Bar dataKey="discount" name={t("nav.discounts", "Discounts")} fill={chartColor(3)} radius={[4, 4, 0, 0]} maxBarSize={56} {...chartMotion} />
                      </BarChart>
                    ) : (
                      <AreaChart data={tsData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                        <defs>
                          <linearGradient id="disc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColor(3)} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={chartColor(3)} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {grid}
                        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                        <Tooltip content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                        <Area type="monotone" dataKey="discount" name={t("nav.discounts", "Discounts")} stroke={chartColor(3)} fill="url(#disc)" strokeWidth={2} {...chartMotion} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </ChartFrame>
              )}
          </ChartCard>
        </div>
      </Stagger>
    </div>
  );
}

// ── Channel (dine-in / takeaway / delivery) ─────────────────────────────────
export function ChannelTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t } = useTranslation();
  const chartMotion = useChartMotion();
  const q = useBranchChannelBreakdown(branchId, range, { query: { enabled: !!branchId } });
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const label = useCallback((channel: string) => t(`orders.${channel === "dine_in" ? "dineIn" : channel}`, channel), [t]);
  const channelCols = useMemo<ColumnDef<(typeof rows)[number]>[]>(() => [
    { id: "channel", header: t("orders.channel", "Channel"), meta: { label: t("orders.channel", "Channel"), phone: "title" }, cell: ({ row: { original: r } }) => <span className="font-medium">{label(r.channel)}</span> },
    { id: "orders", header: t("dashboard.orders", "Orders"), meta: { label: t("dashboard.orders", "Orders"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.orders) },
    { id: "revenue", header: t("dashboard.revenue", "Revenue"), meta: { label: t("dashboard.revenue", "Revenue"), numeric: true }, cell: ({ row: { original: r } }) => <span className="font-semibold">{fmtMoney(r.revenue)}</span> },
    { id: "aov", header: t("analytics.aov", "AOV"), meta: { label: t("analytics.aov", "AOV"), numeric: true }, cell: ({ row: { original: r } }) => fmtMoney(r.avg_order_value) },
  ], [t, label]);
  const chart = useMemo(() => rows.map((r) => ({ name: label(r.channel), revenue: r.revenue })), [rows, label]);

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByChannel", "Revenue by Channel")}>
        {q.isLoading ? <ChartSkeleton /> : q.isError ? <ChartError className="h-72" onRetry={() => q.refetch()} /> : chart.length === 0
          ? <ChartEmpty className="h-72" />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  {grid}
                  <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                  <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={72} {...chartMotion} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <ChartCard title={t("analytics.channelDetails", "Channel Details")} contentClassName="px-0 sm:px-0">
        <DataTable framed={false} hideViewOptions columns={channelCols} data={rows} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} emptyState={<ChartEmpty />} getRowId={(r) => r.channel} pageSize={50} />
      </ChartCard>
    </div>
  );
}

