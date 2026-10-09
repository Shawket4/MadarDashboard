import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Ban, Coins, Percent, Receipt, ShoppingBasket, TrendingUp } from "lucide-react";

import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { SegmentedControl } from "@/components/app/segmented-control";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { ExcludeItemsControl, excludeItemsParam, useExcludedItems } from "@/components/app/exclude-items-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { fmtHour, fmtPercent, fmtMoney, fmtMoneyCompact, fmtNumber, fmtPeriod } from "@/lib/format";
import { PAYMENT_COLORS, type PaymentMethod } from "@/data/config/constants";
import {
  useBranchAddonSales, useBranchChannelBreakdown, useBranchCombinedItemSales, useBranchSales,
  useBranchSalesPeakDays, useBranchSalesPeakHours, useBranchSalesTimeseries, useBranchTellerStats,
  useBranchWaiterStats, useOrgBranchComparison,
} from "@/data/api/generated/api";
import type { PeakDayPoint, PeakHourPoint, TimeseriesPoint } from "@/data/api/generated/models";
import { WEEKDAYS } from "@/features/staff/util";
import { GRANULARITIES, type Granularity, type MethodMap, tName } from "./lib";

export type Range = { from?: string; to?: string };

const AXIS = CHART_AXIS_TICK;
const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />;

function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="h-72 w-full">{children}</div>;
}
function ChartSkeleton() {
  return <Skeleton className="h-72 w-full" />;
}
/** A failed load inside a chart card — never rendered as empty. */
function ChartError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return <ErrorState className={cn("border-0 bg-transparent", className)} onRetry={onRetry} />;
}
function ChartEmpty({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      className={cn("border-0 bg-transparent", className)}
      title={t("analytics.noData", "No data for this period")}
    />
  );
}

// ── Overview ────────────────────────────────────────────────────────────────
export function OverviewTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  // Excluded from the Items Sold KPI only (server ignores it everywhere else).
  const [excludedItems, setExcludedItems] = useExcludedItems();
  const q = useBranchSales(
    branchId,
    { ...range, exclude_items: excludeItemsParam(excludedItems) },
    { query: { enabled: !!branchId } },
  );
  const d = q.data;
  const aov = d && d.total_orders ? Math.round(d.total_revenue / d.total_orders) : 0;

  const payment = useMemo(() => {
    const map = (d?.revenue_by_method ?? {}) as MethodMap;
    return Object.entries(map).map(([method, v]) => ({ method, value: Number(v) || 0 })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  }, [d]);

  const byCategory = useMemo(
    () => (d?.by_category ?? [])
      .map((c) => ({ name: tName(c.category_name ?? "—", c.category_name_translations, i18n.language), revenue: c.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    [d, i18n.language],
  );

  const kpis: LedgerItem[] = [
    { key: "revenue", label: t("dashboard.revenue", "Revenue"), icon: Coins, accent: "neutral", value: d?.total_revenue ?? 0, formatType: "money", loading: q.isLoading },
    { key: "tax", label: t("orders.tax", "Tax"), icon: Percent, accent: "info", value: d?.total_tax ?? 0, formatType: "money", loading: q.isLoading },
    { key: "orders", label: t("dashboard.orders", "Orders"), icon: Receipt, accent: "primary", value: d?.total_orders ?? 0, formatType: "number", loading: q.isLoading },
    {
      key: "line_items",
      label: t("analytics.itemsSold", "Items Sold"),
      icon: ShoppingBasket,
      accent: "info",
      value: d?.total_line_items ?? 0,
      formatType: "number",
      loading: q.isLoading,
      hint: excludedItems.length ? t("analytics.nExcluded", "{{count}} item excluded", { count: excludedItems.length }) : undefined,
      action: <ExcludeItemsControl excluded={excludedItems} onChange={setExcludedItems} />,
    },
    { key: "aov", label: t("analytics.avgOrder", "Avg Order"), icon: TrendingUp, accent: "info", value: aov, formatType: "money", loading: q.isLoading },
    { key: "voided", label: t("orders.voided", "Voided"), icon: Ban, accent: "warning", value: d?.voided_orders ?? 0, formatType: "number", loading: q.isLoading },
  ];

  return (
    <div className="space-y-4">
      <LedgerStrip items={kpis} />

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(0.06)}
        className="grid gap-4 lg:grid-cols-2"
      >
        <motion.div variants={fadeInUp}>
          <ChartCard title={t("analytics.revenueByPayment", "Revenue by Payment Method")}>
            {q.isLoading ? <ChartSkeleton /> : q.isError ? <ChartError className="h-72" onRetry={() => q.refetch()} /> : payment.length === 0
              ? <ChartEmpty className="h-72" />
              : (
                <div className="space-y-3">
                  <ChartFrame>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={payment} dataKey="value" nameKey="method" innerRadius="55%" outerRadius="80%" paddingAngle={2} isAnimationActive={!reduced}>
                          {payment.map((p, i) => <Cell key={p.method} fill={PAYMENT_COLORS[p.method as PaymentMethod] ?? chartColor(i)} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent formatter={(v, n) => `${t(`payments.${n}`, String(n))}: ${fmtMoney(v)}`} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                  {/* Persistent legend — swatch + label + value so color is never the only signal */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pb-1">
                    {payment.map((p, i) => (
                      <div key={p.method} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{ background: PAYMENT_COLORS[p.method as PaymentMethod] ?? chartColor(i) }}
                          aria-hidden="true"
                        />
                        <span>{t(`payments.${p.method}`, p.method)}</span>
                        <span className="font-medium tabular text-foreground">{fmtMoney(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </ChartCard>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <ChartCard title={t("analytics.byCategory", "By Category")}>
            {q.isLoading ? <ChartSkeleton /> : q.isError ? <ChartError className="h-72" onRetry={() => q.refetch()} /> : byCategory.length === 0
              ? <ChartEmpty className="h-72" />
              : (
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCategory} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                      {grid}
                      <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} minTickGap={4} />
                      <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                      <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                      <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={!reduced} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              )}
          </ChartCard>
        </motion.div>
      </motion.div>

      <motion.div initial="hidden" animate="show" variants={fadeInUp}>
        <ChartCard title={t("analytics.topItemsQty", "Top Items by Quantity Sold")}>
          {q.isLoading
            ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
            : q.isError
              ? <ChartError onRetry={() => q.refetch()} />
            : (d?.top_items ?? []).length === 0
              ? <ChartEmpty />
              : (
                <div className="divide-y">
                  {(d?.top_items ?? []).slice(0, 10).map((it, i) => (
                    <div key={it.menu_item_id} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 shrink-0 text-end font-mono text-xs text-muted-foreground tabular">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{tName(it.item_name, it.item_name_translations, i18n.language)}</span>
                      <span className="text-xs text-muted-foreground tabular">{fmtNumber(it.quantity_sold)} {t("analytics.sold", "sold")}</span>
                      <span className="min-w-24 text-end font-mono text-sm font-semibold tabular">{fmtMoney(it.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
        </ChartCard>
      </motion.div>
    </div>
  );
}

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
  const reduced = useReducedMotion();
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
                    <Bar dataKey="avg_revenue_per_day" name={t("dashboard.revenue", "Revenue")} fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={!reduced} />
                  </BarChart>
                ) : gran === "monthly" ? (
                  <BarChart data={tsData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                    {grid}
                    <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                    <Tooltip cursor={{ fill: "var(--muted)" }} content={<RevenueSplitTooltip />} />
                    <Bar dataKey="revenue" name={t("dashboard.revenue", "Revenue")} fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={!reduced} />
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
                    <Area type="monotone" dataKey="revenue" name={t("dashboard.revenue", "Revenue")} stroke={chartColor(0)} fill="url(#rev)" strokeWidth={2} isAnimationActive={!reduced} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(0.06)}
        className="grid gap-4 lg:grid-cols-2"
      >
        <motion.div variants={fadeInUp}>
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
                      <Bar dataKey={isPeak ? "avg_orders_per_day" : "orders"} name={t("dashboard.orders", "Orders")} fill={chartColor(1)} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={!reduced} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              )}
          </ChartCard>
        </motion.div>

        <motion.div variants={fadeInUp}>
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
                        <Bar dataKey="discount" name={t("nav.discounts", "Discounts")} fill={chartColor(3)} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={!reduced} />
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
                        <Area type="monotone" dataKey="discount" name={t("nav.discounts", "Discounts")} stroke={chartColor(3)} fill="url(#disc)" strokeWidth={2} isAnimationActive={!reduced} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </ChartFrame>
              )}
          </ChartCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Items ────────────────────────────────────────────────────────────────────
export function ItemsTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t, i18n } = useTranslation();
  const items = useBranchCombinedItemSales(branchId, { ...range, limit: 50 }, { query: { enabled: !!branchId } });
  const addons = useBranchAddonSales(branchId, { ...range, limit: 20 }, { query: { enabled: !!branchId } });
  const rows = useMemo(() => items.data ?? [], [items.data]);
  const itemCols = useMemo<ColumnDef<NonNullable<typeof items.data>[number]>[]>(() => [
    { id: "name", header: t("common.name", "Name"), meta: { label: t("common.name", "Name"), phone: "title" }, cell: ({ row: { original: r } }) => <span className="font-medium">{tName(r.item_name, r.item_name_translations, i18n.language)}</span> },
    { id: "total", header: t("analytics.totalSold", "Total sold"), meta: { label: t("analytics.totalSold", "Total sold"), numeric: true }, cell: ({ row: { original: r } }) => <span className="font-semibold">{fmtNumber(r.total_qty)}</span> },
  ], [t, i18n.language]);
  const addonCols = useMemo<ColumnDef<NonNullable<typeof addons.data>[number]>[]>(() => [
    { id: "name", header: t("common.name", "Name"), meta: { label: t("common.name", "Name"), phone: "title" }, cell: ({ row: { original: r } }) => <span className="font-medium">{tName(r.addon_name, r.addon_name_translations, i18n.language)}</span> },
    { id: "sold", header: t("analytics.sold", "sold"), meta: { label: t("analytics.sold", "sold"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.quantity_sold) },
    { id: "revenue", header: t("dashboard.revenue", "Revenue"), meta: { label: t("dashboard.revenue", "Revenue"), numeric: true }, cell: ({ row: { original: r } }) => <span className="font-semibold">{fmtMoney(r.revenue)}</span> },
  ], [t, i18n.language]);

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.tabs.items", "Items")} contentClassName="px-0 sm:px-0">
        <DataTable framed={false} hideViewOptions columns={itemCols} data={rows} loading={items.isLoading} error={items.error} onRetry={() => items.refetch()} emptyState={<ChartEmpty />} getRowId={(r) => r.item_id} pageSize={50} />
      </ChartCard>

      <ChartCard title={t("analytics.addonSales", "Addon Sales")} contentClassName="px-0 sm:px-0">
        <DataTable framed={false} hideViewOptions columns={addonCols} data={addons.data ?? []} loading={addons.isLoading} error={addons.error} onRetry={() => addons.refetch()} emptyState={<ChartEmpty />} getRowId={(r) => r.addon_item_id} />
      </ChartCard>
    </div>
  );
}

// ── Tellers ──────────────────────────────────────────────────────────────────
export function TellersTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const q = useBranchTellerStats(branchId, { ...range, limit: 50 }, { query: { enabled: !!branchId } });
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const tellerCols = useMemo<ColumnDef<(typeof rows)[number]>[]>(() => [
    { id: "name", header: t("users.role", "Teller"), meta: { label: t("users.role", "Teller"), phone: "title" }, cell: ({ row: { original: r } }) => <span className="font-medium">{r.teller_name}</span> },
    { id: "orders", header: t("dashboard.orders", "Orders"), meta: { label: t("dashboard.orders", "Orders"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.orders) },
    { id: "revenue", header: t("dashboard.revenue", "Revenue"), meta: { label: t("dashboard.revenue", "Revenue"), numeric: true }, cell: ({ row: { original: r } }) => <span className="font-semibold">{fmtMoney(r.revenue)}</span> },
    { id: "aov", header: t("analytics.aov", "AOV"), meta: { label: t("analytics.aov", "AOV"), numeric: true }, cell: ({ row: { original: r } }) => fmtMoney(r.avg_order_value) },
    { id: "voided", header: t("orders.voided", "Voided"), meta: { label: t("orders.voided", "Voided"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.voided) },
    { id: "tills", header: t("nav.tills", "Tills"), meta: { label: t("nav.tills", "Tills"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.shifts) },
  ], [t]);
  const chart = useMemo(
    () => [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((r) => ({ name: r.teller_name, revenue: r.revenue })),
    [rows],
  );

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByTeller", "Revenue by Teller")}>
        {q.isLoading ? <ChartSkeleton /> : q.isError ? <ChartError className="h-72" onRetry={() => q.refetch()} /> : chart.length === 0
          ? <ChartEmpty className="h-72" />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} />
                  <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={110} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />

                  <Bar dataKey="revenue" fill={chartColor(2)} radius={[0, 4, 4, 0]} isAnimationActive={!reduced} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <ChartCard title={t("analytics.tellerDetails", "Teller Details")} contentClassName="px-0 sm:px-0">
        <DataTable framed={false} hideViewOptions columns={tellerCols} data={rows} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} emptyState={<ChartEmpty />} pageSize={50} />
      </ChartCard>
    </div>
  );
}

// ── Waiters ──────────────────────────────────────────────────────────────────
export function WaitersTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const q = useBranchWaiterStats(branchId, range, { query: { enabled: !!branchId } });
  const rows = useMemo(() => q.data?.waiters ?? [], [q.data]);
  const waiterCols = useMemo<ColumnDef<(typeof rows)[number]>[]>(() => [
    { id: "name", header: t("tills.waiter", "Waiter"), meta: { label: t("tills.waiter", "Waiter"), phone: "title" }, cell: ({ row: { original: r } }) => <span className="font-medium">{r.waiter_name}</span> },
    { id: "orders", header: t("dashboard.orders", "Orders"), meta: { label: t("dashboard.orders", "Orders"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.orders) },
    { id: "revenue", header: t("dashboard.revenue", "Revenue"), meta: { label: t("dashboard.revenue", "Revenue"), numeric: true }, cell: ({ row: { original: r } }) => <span className="font-semibold">{fmtMoney(r.revenue)}</span> },
    { id: "aov", header: t("analytics.aov", "AOV"), meta: { label: t("analytics.aov", "AOV"), numeric: true }, cell: ({ row: { original: r } }) => fmtMoney(r.avg_order_value) },
    { id: "items", header: t("analytics.itemsSold", "Items Sold"), meta: { label: t("analytics.itemsSold", "Items Sold"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.line_items) },
    { id: "ipo", header: t("analytics.itemsPerOrder", "Items / Order"), meta: { label: t("analytics.itemsPerOrder", "Items / Order"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.avg_items_per_order, { maximumFractionDigits: 1 }) },
    { id: "voided", header: t("orders.voided", "Voided"), meta: { label: t("orders.voided", "Voided"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.voided) },
  ], [t]);
  const chart = useMemo(
    () => [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((r) => ({ name: r.waiter_name, revenue: r.revenue })),
    [rows],
  );

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByWaiter", "Revenue by Waiter")}>
        {q.isLoading ? <ChartSkeleton /> : q.isError ? <ChartError className="h-72" onRetry={() => q.refetch()} /> : chart.length === 0
          ? <ChartEmpty className="h-72" />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} />
                  <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={110} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />

                  <Bar dataKey="revenue" fill={chartColor(4)} radius={[0, 4, 4, 0]} isAnimationActive={!reduced} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <ChartCard title={t("analytics.waiterDetails", "Waiter Details")} contentClassName="px-0 sm:px-0">
        <DataTable framed={false} hideViewOptions columns={waiterCols} data={rows} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} emptyState={<ChartEmpty />} pageSize={50} />
        {/* Waiter-attributed orders are a subset (teller-direct + delivery never carry one) — caption the gap so totals don't look short vs Overview. */}
        {!q.isLoading && !q.isError && q.data && q.data.total_orders > 0 ? (
          <p className="px-4 pt-3 text-xs text-muted-foreground">
            {t("analytics.waiterCoverage", "{{attributed}} of {{total}} orders came through waiters", {
              attributed: fmtNumber(q.data.attributed_orders),
              total: fmtNumber(q.data.total_orders),
            })}
          </p>
        ) : null}
      </ChartCard>
    </div>
  );
}

// ── Branches (org comparison) ────────────────────────────────────────────────
export function BranchesTab({ orgId, range }: { orgId: string; range: Range }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const q = useOrgBranchComparison(orgId, range, { query: { enabled: !!orgId } });
  const rows = useMemo(() => q.data?.branches ?? [], [q.data]);
  const branchCols = useMemo<ColumnDef<(typeof rows)[number]>[]>(() => [
    { id: "name", header: t("nav.branches", "Branch"), meta: { label: t("nav.branches", "Branch"), phone: "title" }, cell: ({ row: { original: r } }) => <span className="font-medium">{r.branch_name}</span> },
    { id: "orders", header: t("dashboard.orders", "Orders"), meta: { label: t("dashboard.orders", "Orders"), numeric: true }, cell: ({ row: { original: r } }) => fmtNumber(r.total_orders) },
    { id: "revenue", header: t("dashboard.revenue", "Revenue"), meta: { label: t("dashboard.revenue", "Revenue"), numeric: true }, cell: ({ row: { original: r } }) => <span className="font-semibold">{fmtMoney(r.total_revenue)}</span> },
    { id: "aov", header: t("analytics.aov", "AOV"), meta: { label: t("analytics.aov", "AOV"), numeric: true }, cell: ({ row: { original: r } }) => fmtMoney(r.avg_order_value) },
    { id: "void", header: t("analytics.voidRate", "Void Rate"), meta: { label: t("analytics.voidRate", "Void Rate"), numeric: true }, cell: ({ row: { original: r } }) => fmtPercent(r.void_rate_pct / 100) },
  ], [t]);
  const chart = useMemo(
    () => [...rows].sort((a, b) => b.total_revenue - a.total_revenue).map((b) => ({ name: b.branch_name, revenue: b.total_revenue })),
    [rows],
  );

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByBranch", "Revenue by Branch")}>
        {q.isLoading ? <ChartSkeleton /> : q.isError ? <ChartError className="h-72" onRetry={() => q.refetch()} /> : chart.length === 0
          ? <ChartEmpty className="h-72" />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  {grid}
                  <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} minTickGap={4} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                  <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={!reduced} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <ChartCard title={t("analytics.branchDetails", "Branch Details")} contentClassName="px-0 sm:px-0">
        <DataTable framed={false} hideViewOptions columns={branchCols} data={rows} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} emptyState={<ChartEmpty />} pageSize={50} />
      </ChartCard>
    </div>
  );
}

// ── Channel (dine-in / takeaway / delivery) ─────────────────────────────────
export function ChannelTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
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
                  <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={72} isAnimationActive={!reduced} />
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

