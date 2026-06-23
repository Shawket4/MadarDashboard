import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Ban, CalendarRange, Coins, Receipt, Store, TrendingUp } from "lucide-react";
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

import { Page } from "@/components/app/page";
import { ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { DeliveryKpis } from "@/components/app/delivery-kpis";
import { EmptyState } from "@/components/app/empty-state";
import { ConciseValue, LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNT_ANIM_MS, fadeInUp, listItem, staggerContainer } from "@/lib/motion";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtPeriod } from "@/lib/format";
import { APP_TZ, PAYMENT_COLORS, type PaymentMethod } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import {
  useBranchDeliverySales,
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

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

export function DashboardPage() {
  const { t } = useTranslation();
  const name = useAuthStore((s) => s.user?.name);
  const role = useAuthStore((s) => s.user?.role);
  const userOrgId = useAuthStore((s) => s.user?.org_id);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const activeTimezone = useAppStore((s) => s.activeTimezone) ?? APP_TZ;
  const orgId = role === "super_admin" ? selectedOrgId : (userOrgId ?? null);

  const { branchId, scopeBranchId, from, to, preset } = useScope();
  const granularity = preset === "today" || preset === "yesterday" ? "hourly" : "daily";

  const range = { from: from ?? undefined, to: to ?? undefined };

  const branchSales = useBranchSales(branchId ?? "", { ...range }, { query: { enabled: !!branchId } });
  // Org-wide trend when "all branches": the timeseries endpoint takes the
  // all-branches sentinel and rolls every branch's periods together.
  const timeseries = useBranchSalesTimeseries(
    scopeBranchId,
    { ...range, granularity },
    { query: { enabled: !!orgId } },
  );
  const comparison = useOrgBranchComparison(orgId ?? "", { ...range }, { query: { enabled: !!orgId } });
  // Delivery + per-channel KPIs for the current scope (nil branch = all branches).
  const deliverySales = useBranchDeliverySales(scopeBranchId, { ...range }, { query: { enabled: !!orgId } });

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

  const paymentTotal = useMemo(() => paymentData.reduce((s, d) => s + d.value, 0), [paymentData]);

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

  // Scope context line — the ledger's header: which branch, which period, which zone.
  const branchLabel = branchId
    ? (branches.find((b) => b.branch_id === branchId)?.branch_name ?? t("scope.branch", "Branch"))
    : t("scope.allBranches", "All branches");
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");
  // Reflect the resolved active zone (branch → org → Cairo), not a hardcoded label.
  // Cairo keeps its localized name; other zones fall back to the IANA city.
  const tzCity = (activeTimezone.split("/").pop() ?? activeTimezone).replace(/_/g, " ");
  const tzLabel =
    activeTimezone === APP_TZ
      ? t("common.cairoTime", "Cairo time")
      : t("common.timezoneLabel", { city: tzCity, defaultValue: `${tzCity} time` });

  // All four headline KPIs as the canonical StatCard (via LedgerStrip) — the
  // same card, scale, and compact/expand behavior used across the app.
  const kpiCards: LedgerItem[] = [
    { key: "revenue", label: t("dashboard.revenue", "Revenue"), icon: Coins, accent: "brand", value: kpis.revenue, formatType: "money", loading: kpiLoading },
    { key: "orders", label: t("nav.orders", "Orders"), icon: Receipt, accent: "info", value: kpis.orders, formatType: "number", loading: kpiLoading },
    { key: "avg", label: t("dashboard.avgTicket", "Avg ticket"), icon: TrendingUp, accent: "success", value: avgTicket, formatType: "money", loading: kpiLoading },
    { key: "voided", label: t("dashboard.voided", "Voided"), icon: Ban, accent: "warning", value: kpis.voided, formatType: "number", loading: kpiLoading },
  ];

  return (
    <Page>
      {/* Masthead — greeting + the headline KPIs. All four are the canonical
          StatCard (via LedgerStrip): one scale, one card, fully responsive. The
          revenue trend lives in its own chart below, so no oversized hero. */}
      <motion.section variants={fadeInUp} initial="hidden" animate="show" className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{title}</h1>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Store className="size-3.5" /> {branchLabel}
            </span>
            <span aria-hidden className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="size-3.5" /> {periodLabel}
            </span>
            <span aria-hidden className="text-border">·</span>
            <span>{tzLabel}</span>
          </div>
        </div>

        <LedgerStrip items={kpiCards} dense />
      </motion.section>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(0.06)}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {/* Revenue trend */}
        <motion.div variants={fadeInUp} className="h-full lg:col-span-2">
          <ChartCard className="h-full" title={t("dashboard.revenueTrend", "Revenue trend")}>
            {timeseries.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : trendData.length === 0 ? (
              <EmptyState title={t("common.noResults", "No results found")} className="h-64 border-0" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
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
                      fill={chartColor(0)}
                      fillOpacity={0.12}
                      animationDuration={COUNT_ANIM_MS}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </motion.div>

        {/* Payment mix — donut + ledger-style legend */}
        <motion.div variants={fadeInUp} className="h-full">
          <ChartCard className="h-full" title={t("dashboard.payments", "Payment mix")}>
            {kpiLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : paymentData.length === 0 ? (
              <EmptyState title={t("common.noResults", "No results found")} className="h-64 border-0" />
            ) : (
              <div className="space-y-4">
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        dataKey="value"
                        nameKey="method"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {paymentData.map((d, i) => (
                          <Cell key={d.method} fill={PAYMENT_COLORS[d.method as PaymentMethod] ?? chartColor(i)} />
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
                <dl className="space-y-2">
                  {paymentData.map((d, i) => (
                    <div key={d.method} className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: PAYMENT_COLORS[d.method as PaymentMethod] ?? chartColor(i) }}
                      />
                      <dt className="truncate text-muted-foreground">{t(`payments.${d.method}`, d.method)}</dt>
                      <dd className="ms-auto shrink-0 tabular font-medium">{fmtMoney(d.value)}</dd>
                      <dd className="w-10 shrink-0 text-end tabular text-xs text-muted-foreground">
                        {paymentTotal ? Math.round((d.value / paymentTotal) * 100) : 0}%
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </ChartCard>
        </motion.div>
      </motion.div>

      {/* Branch leaderboard */}
      <ChartCard title={t("dashboard.branchPerformance", "Branch performance")}>
        {comparison.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : rankedBranches.length === 0 ? (
          <EmptyState title={t("common.noResults", "No results found")} className="border-0" />
        ) : (
          <motion.ol
            initial="hidden"
            animate="show"
            variants={staggerContainer(0.04)}
            className="space-y-1"
          >
            {rankedBranches.map((b, i) => (
              <motion.li
                key={b.branch_id}
                variants={listItem}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{b.branch_name}</span>
                    <span className="shrink-0 tabular text-muted-foreground">
                      {fmtNumber(b.total_orders)} {t("nav.orders", "Orders").toLowerCase()}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, b.pct * 100)}%` }} />
                  </div>
                </div>
                <span className="shrink-0 text-end tabular text-sm font-semibold">
                  <ConciseValue full={fmtMoney(b.total_revenue)} compact={fmtMoneyCompact(b.total_revenue)} />
                </span>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </ChartCard>

      {/* Delivery + per-channel KPIs */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{t("delivery.kpisTitle", "Delivery")}</h2>
          <span className="text-sm text-muted-foreground">{t("delivery.byChannel", "By channel")}</span>
        </div>
        <DeliveryKpis data={deliverySales.data} loading={deliverySales.isLoading} />
      </section>
    </Page>
  );
}
