import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, Ban, Coins, Receipt, TrendingUp, Users } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { StatCard } from "@/components/app/stat-card";
import { ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtPeriod } from "@/lib/format";
import { PAYMENT_COLORS, type PaymentMethod } from "@/data/config/constants";
import { useScope } from "@/data/scope/use-scope";
import { usePageSearch } from "@/data/scope/use-page-search";
import { useOrgId } from "@/hooks/use-org-id";
import {
  useBranchAddonSales, useBranchCombinedItemSales, useBranchSales,
  useBranchSalesTimeseries, useBranchTellerStats, useOrgBranchComparison,
} from "@/data/api/generated/api";
import type { TimeseriesPoint } from "@/data/api/generated/models";
import { GRANULARITIES, type Granularity, type MethodMap, tName } from "./lib";

type Range = { from?: string; to?: string };
const AXIS = { fontSize: 11, stroke: "var(--muted-foreground)" };
const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />;

function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="h-72 w-full">{children}</div>;
}
function Loading() { return <div className="grid h-72 place-items-center"><Skeleton className="size-full" /></div>; }

// ── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t, i18n } = useTranslation();
  const q = useBranchSales(branchId, range, { query: { enabled: !!branchId } });
  const d = q.data;
  const aov = d && d.total_orders ? Math.round(d.total_revenue / d.total_orders) : 0;

  const payment = useMemo(() => {
    const map = (d?.revenue_by_method ?? {}) as MethodMap;
    return Object.entries(map).map(([method, v]) => ({ method, value: Number(v) || 0 })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  }, [d]);
  const byCategory = useMemo(() => (d?.by_category ?? []).map((c) => ({ name: tName(c.category_name ?? "—", c.category_name_translations, i18n.language), revenue: c.revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 10), [d, i18n.language]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.revenue", "Revenue")} value={d?.total_revenue ?? 0} formatType="money" icon={Coins} accent="success" loading={q.isLoading} />
        <StatCard label={t("dashboard.orders", "Orders")} value={d?.total_orders ?? 0} icon={Receipt} loading={q.isLoading} />
        <StatCard label={t("analytics.avgOrder", "Avg Order")} value={aov} formatType="money" icon={TrendingUp} accent="info" loading={q.isLoading} />
        <StatCard label={t("orders.voided", "Voided")} value={d?.voided_orders ?? 0} icon={Ban} accent="warning" loading={q.isLoading} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("analytics.revenueByPayment", "Revenue by Payment Method")}>
          {q.isLoading ? <Loading /> : payment.length === 0 ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} /> : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payment} dataKey="value" nameKey="method" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                    {payment.map((p, i) => <Cell key={p.method} fill={PAYMENT_COLORS[p.method as PaymentMethod] ?? chartColor(i)} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent formatter={(v, n) => `${t(`payments.${n}`, String(n))}: ${fmtMoney(v)}`} />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
        </ChartCard>
        <ChartCard title={t("analytics.byCategory", "By Category")}>
          {q.isLoading ? <Loading /> : byCategory.length === 0 ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} /> : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  {grid}
                  <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                  <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
        </ChartCard>
      </div>
      <ChartCard title={t("analytics.topItemsRev", "Top Items by Revenue")}>
        {q.isLoading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : (d?.top_items ?? []).length === 0 ? <EmptyState title={t("analytics.noData", "No data for this period")} />
          : (
            <div className="divide-y">
              {(d?.top_items ?? []).slice(0, 10).map((it, i) => (
                <div key={it.menu_item_id} className="flex items-center gap-3 py-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{tName(it.item_name, it.item_name_translations, i18n.language)}</span>
                  <span className="text-xs text-muted-foreground">{fmtNumber(it.quantity_sold)} {t("analytics.sold", "sold")}</span>
                  <span className="w-24 text-end text-sm font-semibold tabular">{fmtMoney(it.revenue)}</span>
                </div>
              ))}
            </div>
          )}
      </ChartCard>
    </div>
  );
}

// Revenue tooltip with a dynamic per-payment-method breakdown for the period.
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

// ── Revenue (timeseries) ─────────────────────────────────────────────────────
function RevenueTab({ branchId, range, gran, setGran }: { branchId: string; range: Range; gran: Granularity; setGran: (g: Granularity) => void }) {
  const { t } = useTranslation();
  const q = useBranchSalesTimeseries(branchId, { ...range, granularity: gran }, { query: { enabled: !!branchId } });
  const data = useMemo(() => (q.data ?? []).map((p) => ({ ...p, label: fmtPeriod(p.period, gran) })), [q.data, gran]);

  return (
    <div className="space-y-4">
      <Tabs value={gran} onValueChange={(v) => setGran(v as Granularity)}>
        <TabsList>
          {GRANULARITIES.map((g) => <TabsTrigger key={g} value={g}>{t(`analytics.granularity.${g}`, g)}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <ChartCard title={t("analytics.revenueOverTime", "Revenue Over Time")}>
        {q.isLoading ? <Loading /> : data.length === 0 ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} /> : (
          <ChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColor(0)} stopOpacity={0.35} /><stop offset="100%" stopColor={chartColor(0)} stopOpacity={0} /></linearGradient></defs>
                {grid}
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                <Tooltip content={<RevenueSplitTooltip />} />
                <Area type="monotone" dataKey="revenue" name={t("dashboard.revenue", "Revenue")} stroke={chartColor(0)} fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("analytics.ordersOverTime", "Orders Over Time")}>
          {q.isLoading ? <Loading /> : data.length === 0 ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} /> : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  {grid}
                  <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtNumber(v)} />} />
                  <Bar dataKey="orders" name={t("dashboard.orders", "Orders")} fill={chartColor(1)} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
        </ChartCard>
        <ChartCard title={t("analytics.discountsOverTime", "Discounts Over Time")}>
          {q.isLoading ? <Loading /> : data.length === 0 ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} /> : (
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <defs><linearGradient id="disc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColor(3)} stopOpacity={0.35} /><stop offset="100%" stopColor={chartColor(3)} stopOpacity={0} /></linearGradient></defs>
                  {grid}
                  <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                  <Tooltip content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                  <Area type="monotone" dataKey="discount" name={t("nav.discounts", "Discounts")} stroke={chartColor(3)} fill="url(#disc)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>
          )}
        </ChartCard>
      </div>
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
        {items.isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : rows.length === 0 ? <EmptyState title={t("analytics.noData", "No data for this period")} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-start font-semibold">{t("common.name", "Name")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("analytics.standalone", "Standalone")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("analytics.inBundles", "In bundles")}</th>
                    <th className="px-4 py-2 text-end font-semibold">{t("analytics.totalSold", "Total sold")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.item_id ?? i} className="border-b last:border-0 hover:bg-muted/30">
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
        {addons.isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : (addons.data ?? []).length === 0 ? <EmptyState title={t("analytics.noData", "No data for this period")} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-start font-semibold">{t("common.name", "Name")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("analytics.sold", "sold")}</th>
                    <th className="px-4 py-2 text-end font-semibold">{t("dashboard.revenue", "Revenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(addons.data ?? []).map((a) => (
                    <tr key={a.addon_item_id} className="border-b last:border-0 hover:bg-muted/30">
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
  const { t } = useTranslation();
  const q = useBranchTellerStats(branchId, { ...range, limit: 50 }, { query: { enabled: !!branchId } });
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const chart = useMemo(() => [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((r) => ({ name: r.teller_name, revenue: r.revenue })), [rows]);

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByTeller", "Revenue by Teller")}>
        {q.isLoading ? <Loading /> : chart.length === 0 ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} /> : (
          <ChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} />
                <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={110} />
                <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                <Bar dataKey="revenue" fill={chartColor(2)} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </ChartCard>
      <ChartCard contentClassName="px-0 sm:px-0">
        {q.isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : rows.length === 0 ? <EmptyState title={t("analytics.noData", "No data for this period")} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-start font-semibold">{t("users.role", "Teller")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("dashboard.orders", "Orders")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("dashboard.revenue", "Revenue")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("analytics.aov", "AOV")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("orders.voided", "Voided")}</th>
                    <th className="px-4 py-2 text-end font-semibold">{t("nav.shifts", "Shifts")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.teller_id} className="border-b last:border-0 hover:bg-muted/30">
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

// ── Branches (org comparison) ────────────────────────────────────────────────
function BranchesTab({ orgId, range }: { orgId: string; range: Range }) {
  const { t } = useTranslation();
  const q = useOrgBranchComparison(orgId, range, { query: { enabled: !!orgId } });
  const rows = useMemo(() => q.data?.branches ?? [], [q.data]);
  const chart = useMemo(() => [...rows].sort((a, b) => b.total_revenue - a.total_revenue).map((b) => ({ name: b.branch_name, revenue: b.total_revenue })), [rows]);

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByBranch", "Revenue by Branch")}>
        {q.isLoading ? <Loading /> : chart.length === 0 ? <EmptyState className="h-72" title={t("analytics.noData", "No data for this period")} /> : (
          <ChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                {grid}
                <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </ChartCard>
      <ChartCard contentClassName="px-0 sm:px-0">
        {q.isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          : rows.length === 0 ? <EmptyState title={t("analytics.noData", "No data for this period")} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-start font-semibold">{t("nav.branches", "Branch")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("dashboard.orders", "Orders")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("dashboard.revenue", "Revenue")}</th>
                    <th className="px-3 py-2 text-end font-semibold">{t("analytics.aov", "AOV")}</th>
                    <th className="px-4 py-2 text-end font-semibold">{t("analytics.voidRate", "Void Rate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.branch_id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{b.branch_name}</td>
                      <td className="px-3 py-2.5 text-end tabular">{fmtNumber(b.total_orders)}</td>
                      <td className="px-3 py-2.5 text-end font-semibold tabular">{fmtMoney(b.total_revenue)}</td>
                      <td className="px-3 py-2.5 text-end tabular text-muted-foreground">{fmtMoney(b.avg_order_value)}</td>
                      <td className="px-4 py-2.5 text-end tabular text-muted-foreground">{b.void_rate_pct.toFixed(1)}%</td>
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
type TabKey = "overview" | "revenue" | "items" | "tellers" | "branches";
const TABS: TabKey[] = ["overview", "revenue", "items", "tellers", "branches"];

export function AnalyticsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId, from, to, preset } = useScope();
  const range: Range = { from: from ?? undefined, to: to ?? undefined };

  const [s, update] = usePageSearch<{ tab: TabKey; gran: Granularity }>();
  const tab: TabKey = s.tab && TABS.includes(s.tab) ? s.tab : "overview";
  const defaultGran: Granularity = preset === "today" || preset === "yesterday" ? "hourly" : "daily";
  const gran: Granularity = s.gran ?? defaultGran;

  const needsBranch = tab !== "branches";
  const blocked = needsBranch && !branchId;

  return (
    <Page>
      <PageHeader title={t("analytics.title", "Analytics")} description={t("analytics.subtitle", "Reports & trends")} />
      <Tabs value={tab} onValueChange={(v) => update({ tab: v as TabKey })}>
        <TabsList>
          {TABS.map((k) => <TabsTrigger key={k} value={k}>{t(`analytics.tabs.${k}`, k)}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {blocked ? (
        <EmptyState icon={tab === "tellers" ? Users : BarChart3} title={t("analytics.pickBranch", "Select a branch")} description={t("analytics.pickBranchHint", "Choose a branch in the scope bar to view this report.")} className={cn("min-h-[50vh]")} />
      ) : tab === "overview" ? <OverviewTab branchId={branchId!} range={range} />
        : tab === "revenue" ? <RevenueTab branchId={branchId!} range={range} gran={gran} setGran={(g) => update({ gran: g })} />
        : tab === "items" ? <ItemsTab branchId={branchId!} range={range} />
        : tab === "tellers" ? <TellersTab branchId={branchId!} range={range} />
        : <BranchesTab orgId={orgId ?? ""} range={range} />}
    </Page>
  );
}
