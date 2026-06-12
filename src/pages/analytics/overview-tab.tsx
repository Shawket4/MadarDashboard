import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { BarChart2, Coffee, Receipt, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { Progress } from "@/shared/ui/progress";
import { StatCard } from "@/shared/ui/stat-card";
import { useBranchSales } from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { fmtMoney } from "@/shared/lib/format";
import { getTranslatedName } from "@/shared/lib/translation";
import { ChartCard } from "./chart-card";


const CHART_HEIGHT = 300;

export function OverviewTab({ branchId, from, to }: { branchId: string; from: string | null; to: string | null }) {
  const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ void i18n.language;
  const { activeMethods, getLabel, colorMap } = usePaymentMethods();
  const { data: sales, isLoading } = useBranchSales(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });

  const pieData = useMemo(() => {
    if (!sales) return [];
    const byMethod = sales.revenue_by_method as Record<string, number> | undefined;
    // FIX: keep chart data in piastres so every formatter divides by 100 exactly once
    return activeMethods.map((pm) => ({
      name: getLabel(pm.name),
      value: byMethod?.[pm.name] ?? 0,
      color: colorMap[pm.name] || "#ccc",
    })).filter((d) => d.value > 0);
  }, [sales, activeMethods, getLabel, colorMap]);

  const topItems = sales?.top_items ?? [];
  const totalTopRevenue = topItems.reduce((s, i) => s + i.revenue, 0);

  if (isLoading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[300px] rounded-xl" />)}</div>;
  if (!sales) return <EmptyState icon={BarChart2} title={t("analytics.noData")} />;

  const aov = sales.total_orders > 0 ? sales.total_revenue / sales.total_orders : 0;
  const voidDenominator = sales.total_orders + sales.voided_orders;
  const voidRate = voidDenominator > 0 ? sales.voided_orders / voidDenominator : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard label={t("orders.totalRevenue")} value={sales.total_revenue} formatType="money" icon={Receipt} accent="success" />
        <StatCard label={t("orders.completed")} value={sales.total_orders} icon={ShoppingBag} accent="info" />
        <StatCard label={t("analytics.avgOrder")} value={aov} formatType="money" icon={TrendingUp} accent="violet" />
        <StatCard label={t("analytics.voidRate")} value={voidRate} formatType="percent" icon={TrendingDown} accent="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t("analytics.revenueByPayment")}>
          {pieData.length === 0 ? (
            <EmptyState icon={Receipt} title={t("analytics.noData")} className="py-10" />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${((e.percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <ReTooltip formatter={(v: number) => fmtMoney(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("analytics.topItems")}>
          {topItems.length === 0 ? (
            <EmptyState icon={Coffee} title={t("analytics.noData")} className="py-10" />
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {topItems.slice(0, 10).map((i) => (
                <div key={i.menu_item_id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate me-2">{getTranslatedName({ name: i.item_name, name_translations: i.item_name_translations }, i18n.language)}</span>
                    <span className="tabular font-semibold">{fmtMoney(i.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={totalTopRevenue ? (i.revenue / totalTopRevenue) * 100 : 0} className="flex-1" />
                    <span className="text-xs text-muted-foreground tabular w-12 text-end">×{i.quantity_sold}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue Tab — ONLY the Revenue Over Time chart, with the original's
// gradient-area styling: filled, overlapping, semi-transparent fills that
// blend visually where they overlap.
// ─────────────────────────────────────────────────────────────────────────────
