import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ban, Coins, Percent, Receipt, ShoppingBasket, TrendingUp } from "lucide-react";

import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { ExcludeItemsControl, useExcludedItems } from "@/components/app/exclude-items-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, useChartMotion } from "@/lib/motion";
import { averageTicket } from "@/lib/average-ticket";
import { fmtMoney, fmtMoneyCompact, fmtNumber } from "@/lib/format";
import { PAYMENT_COLORS, type PaymentMethod } from "@/data/config/constants";
import { useBranchSales } from "@/data/api/generated/api";
import { ServiceModeSplit } from "@/features/analytics/service-mode-split";
import { type MethodMap, type Range, tName } from "@/features/analytics/lib";
import { overviewParams } from "@/features/analytics/queries";
import { CHART_GRID, ChartBody, ChartFrame, ChartGrid, MAX_BAR_SIZE, ReportStack } from "./report-kit";

export function OverviewTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t, i18n } = useTranslation();
  const chartMotion = useChartMotion();
  // Excluded from the Items Sold KPI only (server ignores it everywhere else).
  const [excludedItems, setExcludedItems] = useExcludedItems();
  // Same builder as the sidebar prefetch (analytics/queries.ts).
  const q = useBranchSales(branchId, overviewParams(range, excludedItems), { query: { enabled: !!branchId } });
  const d = q.data;
  const aov = d ? averageTicket(d.total_revenue, d.total_orders) : 0;

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
  const topItems = d?.top_items ?? [];

  // A failed KPI reads "—", never 0 (as on the Tables tab). Loading keeps its skeleton.
  const failed = q.isError;
  const kpi = (item: LedgerItem): LedgerItem =>
    failed ? { ...item, value: "—", formatType: undefined, hint: undefined } : item;

  const kpis: LedgerItem[] = ([
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
  ] satisfies LedgerItem[]).map(kpi);

  const state = (empty: boolean) => ({ loading: q.isLoading, error: q.isError, empty, onRetry: () => void q.refetch() });

  return (
    <ReportStack>
      <LedgerStrip items={kpis} />

      <ChartGrid>
        <ChartCard title={t("analytics.revenueByPayment", "Revenue by Payment Method")}>
          <ChartBody state={state(payment.length === 0)}>
            <div className="space-y-3">
              <ChartFrame>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={payment} dataKey="value" nameKey="method" innerRadius="55%" outerRadius="80%" paddingAngle={2} {...chartMotion}>
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
          </ChartBody>
        </ChartCard>

        <ChartCard title={t("analytics.byCategory", "By Category")}>
          <ChartBody state={state(byCategory.length === 0)}>
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  {CHART_GRID}
                  <XAxis dataKey="name" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} interval={0} minTickGap={4} />
                  <YAxis tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
                  <Bar dataKey="revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={MAX_BAR_SIZE} {...chartMotion} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </ChartBody>
        </ChartCard>
      </ChartGrid>

      <ServiceModeSplit rows={d?.by_service_mode} loading={q.isLoading} error={q.isError} onRetry={() => void q.refetch()} />

      <ChartCard title={t("analytics.topItemsQty", "Top Items by Quantity Sold")}>
        <ChartBody
          state={state(topItems.length === 0)}
          size="auto"
          skeleton={<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>}
        >
          <Stagger className="divide-y">
            {topItems.slice(0, 10).map((it, i) => (
              <div key={it.menu_item_id} className="flex items-center gap-3 py-2.5">
                <span className="w-5 shrink-0 text-end font-mono text-xs text-muted-foreground tabular">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{tName(it.item_name, it.item_name_translations, i18n.language)}</span>
                <span className="text-xs text-muted-foreground tabular">{fmtNumber(it.quantity_sold)} {t("analytics.sold", "sold")}</span>
                <span className="min-w-24 text-end font-mono text-sm font-semibold tabular">{fmtMoney(it.revenue)}</span>
              </div>
            ))}
          </Stagger>
        </ChartBody>
      </ChartCard>
    </ReportStack>
  );
}
