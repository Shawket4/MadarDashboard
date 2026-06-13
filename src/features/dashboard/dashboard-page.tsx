import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Ban, Coins, Receipt, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Page, PageHeader } from "@/components/app/page";
import { StatCard } from "@/components/app/stat-card";
import { ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer } from "@/lib/motion";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtPeriod } from "@/lib/format";
import { PAYMENT_COLORS, type PaymentMethod } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import {
  useBranchSales,
  useBranchSalesTimeseries,
  useOrgBranchComparison,
} from "@/data/api/generated/api";

type MethodMap = Record<string, number>;

const sumMethodMaps = (maps: Array<MethodMap | undefined>): MethodMap => {
  const out: MethodMap = {};
  for (const m of maps) {
    for (const [k, v] of Object.entries(m ?? {})) out[k] = (out[k] ?? 0) + (Number(v) || 0);
  }
  return out;
};

export function DashboardPage() {
  const { t } = useTranslation();
  const name = useAuthStore((s) => s.user?.name);
  const role = useAuthStore((s) => s.user?.role);
  const userOrgId = useAuthStore((s) => s.user?.org_id);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const orgId = role === "super_admin" ? selectedOrgId : (userOrgId ?? null);

  const { branchId, from, to, preset } = useScope();
  const granularity = preset === "today" || preset === "yesterday" ? "hourly" : "daily";

  const range = { from: from ?? undefined, to: to ?? undefined };

  const branchSales = useBranchSales(branchId ?? "", { ...range }, { query: { enabled: !!branchId } });
  const timeseries = useBranchSalesTimeseries(
    branchId ?? "",
    { ...range, granularity },
    { query: { enabled: !!branchId } },
  );
  const comparison = useOrgBranchComparison(orgId ?? "", { ...range }, { query: { enabled: !!orgId } });

  const branches = useMemo(() => comparison.data?.branches ?? [], [comparison.data]);

  // KPIs come from the selected branch, or aggregate across the org when "all branches".
  const kpis = useMemo(() => {
    if (branchId && branchSales.data) {
      const d = branchSales.data;
      return { revenue: d.total_revenue, orders: d.total_orders, voided: d.voided_orders };
    }
    return branches.reduce(
      (acc, b) => ({
        revenue: acc.revenue + b.total_revenue,
        orders: acc.orders + b.total_orders,
        voided: acc.voided + b.voided_orders,
      }),
      { revenue: 0, orders: 0, voided: 0 },
    );
  }, [branchId, branchSales.data, branches]);

  const avgTicket = kpis.orders ? Math.round(kpis.revenue / kpis.orders) : 0;
  const kpiLoading = branchId ? branchSales.isLoading : comparison.isLoading;

  const paymentData = useMemo(() => {
    const map = branchId
      ? ((branchSales.data?.revenue_by_method ?? {}) as MethodMap)
      : sumMethodMaps(branches.map((b) => b.revenue_by_method as MethodMap));
    return Object.entries(map)
      .map(([method, value]) => ({ method, value: Number(value) || 0 }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [branchId, branchSales.data, branches]);

  const trendData = useMemo(
    () => (timeseries.data ?? []).map((p) => ({ period: p.period, revenue: p.revenue, orders: p.orders })),
    [timeseries.data],
  );

  const rankedBranches = useMemo(() => {
    const max = Math.max(1, ...branches.map((b) => b.total_revenue));
    return [...branches]
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 6)
      .map((b) => ({ ...b, pct: b.total_revenue / max }));
  }, [branches]);

  const title = name
    ? t("dashboard.greetingName", { name, defaultValue: `Welcome back, ${name}` })
    : t("dashboard.greeting", "Welcome back");

  return (
    <Page>
      <PageHeader
        title={title}
        description={t("dashboard.subtitle", "Here’s what’s happening across your shop")}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(0.04)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard label={t("dashboard.revenue", "Revenue")} icon={Coins} accent="brand" value={kpis.revenue} formatType="money" loading={kpiLoading} />
        <StatCard label={t("nav.orders", "Orders")} icon={Receipt} accent="primary" value={kpis.orders} formatType="number" loading={kpiLoading} />
        <StatCard label={t("dashboard.avgTicket", "Avg ticket")} icon={TrendingUp} accent="info" value={avgTicket} formatType="money" loading={kpiLoading} />
        <StatCard label={t("dashboard.voided", "Voided")} icon={Ban} accent="warning" value={kpis.voided} formatType="number" loading={kpiLoading} />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title={t("dashboard.revenueTrend", "Revenue trend")} className="lg:col-span-2">
          {!branchId ? (
            <EmptyState title={t("dashboard.pickBranchTrend", "Select a branch to see its revenue trend")} className="h-64 border-0" />
          ) : timeseries.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : trendData.length === 0 ? (
            <EmptyState title={t("common.noResults", "No results found")} className="h-64 border-0" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor(0)} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={chartColor(0)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(v) => fmtPeriod(String(v), granularity)}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtMoneyCompact(Number(v))}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={64}
                  />
                  <Tooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => fmtMoney(v)}
                        labelFormatter={(l) => fmtPeriod(String(l), granularity)}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={t("dashboard.revenue", "Revenue")}
                    stroke={chartColor(0)}
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title={t("dashboard.payments", "Payment mix")}>
          {kpiLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : paymentData.length === 0 ? (
            <EmptyState title={t("common.noResults", "No results found")} className="h-64 border-0" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="value"
                    nameKey="method"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {paymentData.map((d, i) => (
                      <Cell
                        key={d.method}
                        fill={PAYMENT_COLORS[d.method as PaymentMethod] ?? chartColor(i)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v, n) => `${t(`payments.${n}`, String(n))}: ${fmtMoney(v)}`}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title={t("dashboard.branchPerformance", "Branch performance")}>
        {comparison.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : rankedBranches.length === 0 ? (
          <EmptyState title={t("common.noResults", "No results found")} className="border-0" />
        ) : (
          <div className="space-y-3">
            {rankedBranches.map((b) => (
              <div key={b.branch_id} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{b.branch_name}</span>
                  <span className="shrink-0 tabular text-muted-foreground">
                    {fmtMoney(b.total_revenue)} · {fmtNumber(b.total_orders)} {t("nav.orders", "Orders").toLowerCase()}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, b.pct * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </Page>
  );
}
