import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Ban, CalendarRange, Coins, Percent, Receipt, ShoppingBasket, TrendingUp } from "lucide-react";

import { Page } from "@/components/app/page";
import { ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { EmptyState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { ExcludeItemsControl, excludeItemsParam, useExcludedItems } from "@/components/app/exclude-items-control";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { fmtHour, fmtMoney, fmtMoneyCompact, fmtNumber, fmtPeriod } from "@/lib/format";
import { PAYMENT_COLORS, type PaymentMethod } from "@/data/config/constants";
import { useScope } from "@/data/scope/use-scope";
import { usePageSearch } from "@/data/scope/use-page-search";
import { useOrgId } from "@/hooks/use-org-id";
import {
  useBranchAddonSales, useBranchCombinedItemSales, useBranchSales,
  useBranchSalesPeakHours, useBranchSalesTimeseries, useBranchTellerStats,
  useBranchWaiterStats, useOrgBranchComparison,
} from "@/data/api/generated/api";
import type { PeakHourPoint, TimeseriesPoint } from "@/data/api/generated/models";
import { GRANULARITIES, type Granularity, type MethodMap, tName } from "./lib";

type Range = { from?: string; to?: string };


const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />;

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="h-72 w-full">{children}</div>;
}
function ChartSkeleton() {
  return <Skeleton className="h-72 w-full" />;
}

// ── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ branchId, range }: { branchId: string; range: Range }) {
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
    { key: "revenue", label: t("dashboard.revenue", "Revenue"), icon: Coins, accent: "brand", value: d?.total_revenue ?? 0, formatType: "money", loading: q.isLoading },
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
            {q.isLoading ? <ChartSkeleton /> : q.isError ? <EmptyState className="h-72" title={t("common.somethingWrong", "Something went wrong")} /> : payment.length === 0
              ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} />
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
            {q.isLoading ? <ChartSkeleton /> : q.isError ? <EmptyState className="h-72" title={t("common.somethingWrong", "Something went wrong")} /> : byCategory.length === 0
              ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} />
              : (
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCategory} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                      {grid}
                      <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                      <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                      <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              )}
          </ChartCard>
        </motion.div>
      </motion.div>

      <motion.div initial="hidden" animate="show" variants={fadeInUp}>
        <ChartCard title={t("analytics.topItemsRev", "Top Items by Revenue")}>
          {q.isLoading
            ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
            : q.isError
              ? <EmptyState title={t("common.somethingWrong", "Something went wrong")} />
            : (d?.top_items ?? []).length === 0
              ? <EmptyState title={t("analytics.noData", "No data for this period")} />
              : (
                <div className="divide-y">
                  {(d?.top_items ?? []).slice(0, 10).map((it, i) => (
                    <div key={it.menu_item_id} className="flex items-center gap-3 py-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{tName(it.item_name, it.item_name_translations, i18n.language)}</span>
                      <span className="text-xs text-muted-foreground tabular">{fmtNumber(it.quantity_sold)} {t("analytics.sold", "sold")}</span>
                      <span className="w-24 text-end text-sm font-semibold tabular">{fmtMoney(it.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
        </ChartCard>
      </motion.div>
    </div>
  );
}

// Peak-hours tooltip — avg/day, share of total, and period total for each hour bucket.
function PeakHoursTooltip({ active, payload, type }: {
  active?: boolean;
  payload?: { payload: PeakHourPoint & { label: string } }[];
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
    <div className="min-w-44 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {p.label ? <div className="mb-1.5 font-medium text-foreground">{p.label}</div> : null}
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("analytics.avgPerDay", "Avg / Day")}</span>
        <span className="font-semibold tabular text-foreground">{avgVal}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("analytics.shareOfTotal", "Share")}</span>
        <span className="tabular text-foreground">{fmtNumber(pct, { maximumFractionDigits: 1 })}%</span>
      </div>
      <div className="mt-1.5 border-t pt-1.5 flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("analytics.periodTotal", "Period Total")}</span>
        <span className="tabular text-muted-foreground">{totalVal}</span>
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
    </div>
  );
}

// ── Revenue (timeseries + peak hours) ───────────────────────────────────────
function RevenueTab({ branchId, range, gran, setGran }: { branchId: string; range: Range; gran: Granularity; setGran: (g: Granularity) => void }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const isPeak = gran === "peak_hours";

  const tsQ = useBranchSalesTimeseries(branchId, { ...range, granularity: gran }, { query: { enabled: !!branchId && !isPeak } });
  const tsData = useMemo(() => (tsQ.data ?? []).map((p) => ({ ...p, label: fmtPeriod(p.period, gran) })), [tsQ.data, gran]);

  const phQ = useBranchSalesPeakHours(branchId, range, { query: { enabled: !!branchId && isPeak } });
  const phData = useMemo(() => (phQ.data ?? []).map((p) => ({ ...p, label: fmtHour(p.hour) })), [phQ.data]);

  const isLoading = isPeak ? phQ.isLoading : tsQ.isLoading;
  const isError = isPeak ? phQ.isError : tsQ.isError;

  return (
    <div className="space-y-4">
      <Tabs value={gran} onValueChange={(v) => setGran(v as Granularity)}>
        <TabsList>
          {GRANULARITIES.map((g) => <TabsTrigger key={g} value={g}>{t(`analytics.granularity.${g}`, g)}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <ChartCard title={isPeak ? t("analytics.revenueByHour", "Revenue by Hour") : t("analytics.revenueOverTime", "Revenue Over Time")}>
        {isLoading ? <ChartSkeleton /> : isError ? <EmptyState className="h-72" title={t("common.somethingWrong", "Something went wrong")} /> : (isPeak ? phData : tsData).length === 0
          ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                {isPeak ? (
                  <BarChart data={phData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                    {grid}
                    <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={2} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                    <Tooltip cursor={{ fill: "var(--muted)" }} content={<PeakHoursTooltip type="revenue" />} />
                    <Bar dataKey="avg_revenue_per_day" name={t("dashboard.revenue", "Revenue")} fill={chartColor(0)} radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
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
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
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
          <ChartCard title={isPeak ? t("analytics.ordersByHour", "Orders by Hour") : t("analytics.ordersOverTime", "Orders Over Time")}>
            {isLoading ? <ChartSkeleton /> : isError ? <EmptyState className="h-72" title={t("common.somethingWrong", "Something went wrong")} /> : (isPeak ? phData : tsData).length === 0
              ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} />
              : (
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(isPeak ? phData : tsData) as Record<string, string | number>[]} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                      {grid}
                      <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={isPeak ? 2 : 0} />
                      <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={isPeak} width={36} tickFormatter={isPeak ? (v) => fmtNumber(Number(v), { maximumFractionDigits: 1 }) : undefined} />
                      <Tooltip cursor={{ fill: "var(--muted)" }} content={isPeak ? <PeakHoursTooltip type="orders" /> : <ChartTooltipContent formatter={(v) => fmtNumber(v)} />} />
                      <Bar dataKey={isPeak ? "avg_orders_per_day" : "orders"} name={t("dashboard.orders", "Orders")} fill={chartColor(1)} radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              )}
          </ChartCard>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <ChartCard title={isPeak ? t("analytics.discountsByHour", "Discounts by Hour") : t("analytics.discountsOverTime", "Discounts Over Time")}>
            {isLoading ? <ChartSkeleton /> : isError ? <EmptyState className="h-72" title={t("common.somethingWrong", "Something went wrong")} /> : (isPeak ? phData : tsData).length === 0
              ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} />
              : (
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    {isPeak ? (
                      <BarChart data={phData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                        {grid}
                        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={2} />
                        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                        <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                        <Bar dataKey="discount" name={t("nav.discounts", "Discounts")} fill={chartColor(3)} radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
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
                        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
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
function ItemsTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t, i18n } = useTranslation();
  const items = useBranchCombinedItemSales(branchId, { ...range, limit: 50 }, { query: { enabled: !!branchId } });
  const addons = useBranchAddonSales(branchId, { ...range, limit: 20 }, { query: { enabled: !!branchId } });
  const rows = items.data ?? [];

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.tabs.items", "Items")} contentClassName="px-0 sm:px-0">
        {items.isLoading
          ? <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : items.isError
            ? <EmptyState title={t("common.somethingWrong", "Something went wrong")} />
          : rows.length === 0
            ? <EmptyState title={t("analytics.noData", "No data for this period")} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2.5 text-start text-xs font-medium text-muted-foreground">{t("common.name", "Name")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.standalone", "Standalone")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.inBundles", "In bundles")}</th>
                      <th className="px-4 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.totalSold", "Total sold")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.item_id ?? i} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{tName(r.item_name, r.item_name_translations, i18n.language)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(r.standalone_qty)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(r.bundle_qty)}</td>
                        <td className="px-4 py-2.5 text-end font-semibold tabular">{fmtNumber(r.total_qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </ChartCard>

      <ChartCard title={t("analytics.addonSales", "Addon Sales")} contentClassName="px-0 sm:px-0">
        {addons.isLoading
          ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : addons.isError
            ? <EmptyState title={t("common.somethingWrong", "Something went wrong")} />
          : (addons.data ?? []).length === 0
            ? <EmptyState title={t("analytics.noData", "No data for this period")} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2.5 text-start text-xs font-medium text-muted-foreground">{t("common.name", "Name")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.sold", "sold")}</th>
                      <th className="px-4 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("dashboard.revenue", "Revenue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(addons.data ?? []).map((a) => (
                      <tr key={a.addon_item_id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{tName(a.addon_name, a.addon_name_translations, i18n.language)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(a.quantity_sold)}</td>
                        <td className="px-4 py-2.5 text-end font-semibold tabular">{fmtMoney(a.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </ChartCard>
    </div>
  );
}

// ── Tellers ──────────────────────────────────────────────────────────────────
function TellersTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const isRtl = i18n.dir() === "rtl";
  const q = useBranchTellerStats(branchId, { ...range, limit: 50 }, { query: { enabled: !!branchId } });
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const chart = useMemo(
    () => [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((r) => ({ name: r.teller_name, revenue: r.revenue })),
    [rows],
  );

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByTeller", "Revenue by Teller")}>
        {q.isLoading ? <ChartSkeleton /> : q.isError ? <EmptyState className="h-72" title={t("common.somethingWrong", "Something went wrong")} /> : chart.length === 0
          ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} />
                  <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={110} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                  {/* RTL: leading edge is the end of the bar (right in LTR, left in RTL), so flip radius accordingly */}
                  <Bar dataKey="revenue" fill={chartColor(2)} radius={isRtl ? [4, 0, 0, 4] : [0, 4, 4, 0]} isAnimationActive={!reduced} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <ChartCard title={t("analytics.tellerDetails", "Teller Details")} contentClassName="px-0 sm:px-0">
        {q.isLoading
          ? <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : q.isError
            ? <EmptyState title={t("common.somethingWrong", "Something went wrong")} />
          : rows.length === 0
            ? <EmptyState title={t("analytics.noData", "No data for this period")} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2.5 text-start text-xs font-medium text-muted-foreground">{t("users.role", "Teller")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("dashboard.orders", "Orders")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("dashboard.revenue", "Revenue")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.aov", "AOV")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("orders.voided", "Voided")}</th>
                      <th className="px-4 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("nav.shifts", "Shifts")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.teller_id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{r.teller_name}</td>
                        <td className="px-3 py-2.5 text-end tabular">{fmtNumber(r.orders)}</td>
                        <td className="px-3 py-2.5 text-end font-semibold tabular">{fmtMoney(r.revenue)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtMoney(r.avg_order_value)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(r.voided)}</td>
                        <td className="px-4 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(r.shifts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </ChartCard>
    </div>
  );
}

// ── Waiters ──────────────────────────────────────────────────────────────────
function WaitersTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const isRtl = i18n.dir() === "rtl";
  const q = useBranchWaiterStats(branchId, range, { query: { enabled: !!branchId } });
  const rows = useMemo(() => q.data?.waiters ?? [], [q.data]);
  const chart = useMemo(
    () => [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((r) => ({ name: r.waiter_name, revenue: r.revenue })),
    [rows],
  );

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByWaiter", "Revenue by Waiter")}>
        {q.isLoading ? <ChartSkeleton /> : q.isError ? <EmptyState className="h-72" title={t("common.somethingWrong", "Something went wrong")} /> : chart.length === 0
          ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} />
                  <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={110} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                  {/* RTL: leading edge is the end of the bar (right in LTR, left in RTL), so flip radius accordingly */}
                  <Bar dataKey="revenue" fill={chartColor(4)} radius={isRtl ? [4, 0, 0, 4] : [0, 4, 4, 0]} isAnimationActive={!reduced} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <ChartCard title={t("analytics.waiterDetails", "Waiter Details")} contentClassName="px-0 sm:px-0">
        {q.isLoading
          ? <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : q.isError
            ? <EmptyState title={t("common.somethingWrong", "Something went wrong")} />
          : rows.length === 0
            ? <EmptyState title={t("analytics.noData", "No data for this period")} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2.5 text-start text-xs font-medium text-muted-foreground">{t("shifts.waiter", "Waiter")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("dashboard.orders", "Orders")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("dashboard.revenue", "Revenue")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.aov", "AOV")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.itemsSold", "Items Sold")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.itemsPerOrder", "Items / Order")}</th>
                      <th className="px-4 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("orders.voided", "Voided")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.waiter_id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{r.waiter_name}</td>
                        <td className="px-3 py-2.5 text-end tabular">{fmtNumber(r.orders)}</td>
                        <td className="px-3 py-2.5 text-end font-semibold tabular">{fmtMoney(r.revenue)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtMoney(r.avg_order_value)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(r.line_items)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(r.avg_items_per_order, { maximumFractionDigits: 1 })}</td>
                        <td className="px-4 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(r.voided)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
function BranchesTab({ orgId, range }: { orgId: string; range: Range }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const q = useOrgBranchComparison(orgId, range, { query: { enabled: !!orgId } });
  const rows = useMemo(() => q.data?.branches ?? [], [q.data]);
  const chart = useMemo(
    () => [...rows].sort((a, b) => b.total_revenue - a.total_revenue).map((b) => ({ name: b.branch_name, revenue: b.total_revenue })),
    [rows],
  );

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByBranch", "Revenue by Branch")}>
        {q.isLoading ? <ChartSkeleton /> : q.isError ? <EmptyState className="h-72" title={t("common.somethingWrong", "Something went wrong")} /> : chart.length === 0
          ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} />
          : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  {grid}
                  <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                  <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
      </ChartCard>

      <ChartCard title={t("analytics.branchDetails", "Branch Details")} contentClassName="px-0 sm:px-0">
        {q.isLoading
          ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : q.isError
            ? <EmptyState title={t("common.somethingWrong", "Something went wrong")} />
          : rows.length === 0
            ? <EmptyState title={t("analytics.noData", "No data for this period")} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2.5 text-start text-xs font-medium text-muted-foreground">{t("nav.branches", "Branch")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("dashboard.orders", "Orders")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("dashboard.revenue", "Revenue")}</th>
                      <th className="px-3 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.aov", "AOV")}</th>
                      <th className="px-4 py-2.5 text-end text-xs font-medium text-muted-foreground">{t("analytics.voidRate", "Void Rate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((b) => (
                      <tr key={b.branch_id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{b.branch_name}</td>
                        <td className="px-3 py-2.5 text-end tabular">{fmtNumber(b.total_orders)}</td>
                        <td className="px-3 py-2.5 text-end font-semibold tabular">{fmtMoney(b.total_revenue)}</td>
                        <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtMoney(b.avg_order_value)}</td>
                        <td className="px-4 py-2.5 text-end tabular text-muted-foreground">{fmtNumber(b.void_rate_pct, { maximumFractionDigits: 1 })}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </ChartCard>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
type TabKey = "overview" | "revenue" | "items" | "tellers" | "waiters" | "branches";
const TABS: TabKey[] = ["overview", "revenue", "items", "tellers", "waiters", "branches"];

export function AnalyticsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { scopeBranchId, from, to, preset } = useScope();
  const range: Range = { from: from ?? undefined, to: to ?? undefined };
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  const [s, update] = usePageSearch<{ tab: TabKey; gran: Granularity }>();
  const tab: TabKey = s.tab && TABS.includes(s.tab) ? s.tab : "overview";
  const defaultGran: Granularity = preset === "today" || preset === "yesterday" ? "peak_hours" : "daily";
  const gran: Granularity = s.gran ?? defaultGran;

  return (
    <Page>
      {/* Editorial masthead */}
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("analytics.title", "Analytics")}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarRange className="size-3.5" />
          {periodLabel}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => update({ tab: v as TabKey })}>
        <PageTabsList>
          {TABS.map((k) => <PageTabsTrigger key={k} value={k}>{t(`analytics.tabs.${k}`, k)}</PageTabsTrigger>)}
        </PageTabsList>
      </Tabs>

      {tab === "overview" ? <OverviewTab branchId={scopeBranchId} range={range} />
        : tab === "revenue" ? <RevenueTab branchId={scopeBranchId} range={range} gran={gran} setGran={(g) => update({ gran: g })} />
        : tab === "items" ? <ItemsTab branchId={scopeBranchId} range={range} />
        : tab === "tellers" ? <TellersTab branchId={scopeBranchId} range={range} />
        : tab === "waiters" ? <WaitersTab branchId={scopeBranchId} range={range} />
        : <BranchesTab orgId={orgId ?? ""} range={range} />}
    </Page>
  );
}
