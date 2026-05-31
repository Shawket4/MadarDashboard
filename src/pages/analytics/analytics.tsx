import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis,
} from "recharts";
import {
  BarChart2, Coffee, Package, Receipt, ShoppingBag,
  TrendingDown, TrendingUp, Users,
} from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { StatCard } from "@/shared/ui/stat-card";
import { DateRangePicker } from "@/shared/ui/date-range-picker";
import { Badge } from "@/shared/ui/badge";
import { ChartTooltip } from "@/shared/ui/chart-tooltip";
import {
  useBranchSales, useBranchSalesTimeseries as useBranchTimeseries, useBranchTellerStats as useBranchTellers, useBranchAddonSales as useBranchAddons,
  useBranchStock as useBranchStockReport, useOrgBranchComparison as useOrgComparison,
} from "@/shared/api/generated/api";
import { useListBranches as useBranches } from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtPeriod, piastresToEgp } from "@/shared/lib/format";
import { exportToExcel,  } from "@/shared/lib/excel";
import type {
  AddonSalesRow, BranchComparison, ItemSales, StockRow, TellerStats, TimeseriesPoint,
} from "@/shared/types";

type Granularity = "hourly" | "daily" | "monthly";
type TabKey = "overview" | "revenue" | "items" | "tellers" | "branches" | "inventory";

const CHART_HEIGHT = 300;

function ChartCard({ title, children, onExport }: { title: string; children: React.ReactNode; onExport?: () => void }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">{title}</p>
          {onExport && <Button variant="ghost" size="sm" onClick={onExport}>{t("common.export")}</Button>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview Tab — KPIs + payment pie + top items progress
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ branchId, from, to }: { branchId: string; from: string | null; to: string | null }) {
  const { t } = useTranslation();
  const { activeMethods, getLabel, colorMap } = usePaymentMethods();
  const { data: sales, isLoading } = useBranchSales(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });

  const pieData = useMemo(() => {
    if (!sales) return [];
    const byMethod = sales.revenue_by_method as Record<string, number> | undefined;
    return activeMethods.map((pm) => ({
      name: getLabel(pm.name),
      value: piastresToEgp(byMethod?.[pm.name] ?? 0),
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
                <ReTooltip formatter={(v: number) => fmtMoney(v * 100)} />
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
                    <span className="font-medium truncate me-2">{i.item_name}</span>
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
function RevenueTab({
  branchId, from, to, granularity,
}: {
  branchId: string;
  from: string | null;
  to: string | null;
  granularity: Granularity;
}) {
  const { t } = useTranslation();
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
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${(v / 100).toFixed(0)}`} tick={{ fontSize: 11 }} />
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
function ItemsTab({ branchId, from, to }: { branchId: string; from: string | null; to: string | null }) {
  const { t } = useTranslation();
  const { data: sales, isLoading } = useBranchSales(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });
  const { data: addons = [] } = useBranchAddons(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });

  const cols: ColumnDef<ItemSales>[] = [
    { accessorKey: "item_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{row.original.item_name}</span> },
    { accessorKey: "quantity_sold", header: t("common.qty"), cell: ({ row }) => <span className="tabular text-sm">{fmtNumber(row.original.quantity_sold)}</span> },
    { accessorKey: "revenue", header: t("orders.totalRevenue"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{fmtMoney(row.original.revenue)}</span> },
  ];

  const addonCols: ColumnDef<AddonSalesRow>[] = [
    { accessorKey: "addon_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{row.original.addon_name}</span> },
    { accessorKey: "addon_type", header: t("common.type"), cell: ({ row }) => <Badge variant="outline">{t(`menu.addonTypes.${row.original.addon_type}`, { defaultValue: row.original.addon_type })}</Badge> },
    { accessorKey: "quantity_sold", header: t("common.qty"), cell: ({ row }) => <span className="tabular text-sm">{fmtNumber(row.original.quantity_sold)}</span> },
    { accessorKey: "revenue", header: t("orders.totalRevenue"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{fmtMoney(row.original.revenue)}</span> },
  ];

  const exportItems = () => {
    if (!sales) return;
    exportToExcel({
      filename: "Items",
      sheets: [
        {
          name: "Items",
          title: t("analytics.topItemsRev"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (i: ItemSales) => i.item_name, width: 30 },
            { key: "qty", header: t("common.qty"), accessor: (i: ItemSales) => i.quantity_sold, type: "integer", width: 12, total: true },
            { key: "rev", header: t("orders.totalRevenue"), accessor: (i: ItemSales) => i.revenue, type: "money", width: 16, total: true },
          ],
          rows: sales.top_items,
          totals: true,
        },
        {
          name: "Addons",
          title: t("analytics.addonSales"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (a: AddonSalesRow) => a.addon_name, width: 28 },
            { key: "type", header: t("common.type"), accessor: (a: AddonSalesRow) => t(`menu.addonTypes.${a.addon_type}`, { defaultValue: a.addon_type }), width: 16 },
            { key: "qty", header: t("common.qty"), accessor: (a: AddonSalesRow) => a.quantity_sold, type: "integer", width: 12, total: true },
            { key: "rev", header: t("orders.totalRevenue"), accessor: (a: AddonSalesRow) => a.revenue, type: "money", width: 16, total: true },
          ],
          rows: addons,
          totals: true,
        },
      ],
    });
  };

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!sales || sales.top_items.length === 0) return <EmptyState icon={Coffee} title={t("analytics.noData")} />;

  const totalCatRevenue = sales.by_category.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.topItemsRev")} onExport={exportItems}>
        <DataTable columns={cols} data={sales.top_items} searchKey="item_name" pageSize={10} />
      </ChartCard>

      <ChartCard title={t("analytics.byCategory")}>
        <div className="space-y-3">
          {sales.by_category.map((c) => (
            <div key={c.category_id ?? "none"} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {c.category_name ?? t("menu.uncategorised")}
                  <span className="text-muted-foreground text-xs ms-2">×{c.quantity_sold}</span>
                </span>
                <span className="tabular font-semibold">{fmtMoney(c.revenue)}</span>
              </div>
              <Progress value={totalCatRevenue ? (c.revenue / totalCatRevenue) * 100 : 0} />
            </div>
          ))}
        </div>
      </ChartCard>

      {addons.length > 0 && (
        <ChartCard title={t("analytics.addonSales")}>
          <DataTable columns={addonCols} data={addons} searchKey="addon_name" pageSize={10} />
        </ChartCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tellers Tab
// ─────────────────────────────────────────────────────────────────────────────
function TellersTab({ branchId, from, to }: { branchId: string; from: string | null; to: string | null }) {
  const { t } = useTranslation();
  const { data: tellers = [], isLoading } = useBranchTellers(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });

  const chartData = tellers.map((t2) => ({ name: t2.teller_name, revenue: piastresToEgp(t2.revenue), orders: t2.orders }));

  const cols: ColumnDef<TellerStats>[] = [
    { accessorKey: "teller_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{row.original.teller_name}</span> },
    { accessorKey: "orders", header: t("dashboard.orders") },
    { accessorKey: "voided", header: t("orderStatus.voided"), cell: ({ row }) => <span className={row.original.voided > 0 ? "text-destructive" : ""}>{row.original.voided}</span> },
    { accessorKey: "shifts", header: t("nav.shifts") },
    { accessorKey: "avg_order_value", header: t("analytics.aov"), cell: ({ row }) => <span className="tabular">{fmtMoney(row.original.avg_order_value)}</span> },
    { accessorKey: "revenue", header: t("orders.totalRevenue"), cell: ({ row }) => <span className="tabular font-semibold">{fmtMoney(row.original.revenue)}</span> },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Tellers",
      sheets: [{
        name: "Tellers",
        title: t("analytics.revenueByTeller"),
        columns: [
          { key: "name", header: t("common.name"), accessor: (tl: TellerStats) => tl.teller_name, width: 24 },
          { key: "orders", header: t("dashboard.orders"), accessor: (tl: TellerStats) => tl.orders, type: "integer", width: 12, total: true },
          { key: "voided", header: t("orderStatus.voided"), accessor: (tl: TellerStats) => tl.voided, type: "integer", width: 12, total: true },
          { key: "shifts", header: t("nav.shifts"), accessor: (tl: TellerStats) => tl.shifts, type: "integer", width: 12, total: true },
          { key: "aov", header: t("analytics.aov"), accessor: (tl: TellerStats) => tl.avg_order_value, type: "money", width: 14 },
          { key: "revenue", header: t("orders.totalRevenue"), accessor: (tl: TellerStats) => tl.revenue, type: "money", width: 16, total: true },
        ],
        rows: tellers,
        totals: true,
      }],
    });

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (tellers.length === 0) return <EmptyState icon={Users} title={t("analytics.noData")} />;

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByTeller")} onExport={handleExport}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" fontSize={10} tickFormatter={(v) => fmtMoneyCompact(v * 100)} />
            <YAxis type="category" dataKey="name" fontSize={10} width={100} />
            <ReTooltip content={<ChartTooltip valueFormat="money" />} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <DataTable columns={cols} data={tellers} searchKey="teller_name" onExport={handleExport} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Branches Tab — stacked bar keeps Talabat split to avoid double-counting
// ─────────────────────────────────────────────────────────────────────────────
function BranchesTab({ orgId, from, to }: { orgId: string; from: string | null; to: string | null }) {
  const { t } = useTranslation();
  const { activeMethods, getLabel, colorMap } = usePaymentMethods();
  const { data: report, isLoading } = useOrgComparison(orgId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!orgId } });

  const cols: ColumnDef<BranchComparison>[] = [
    { accessorKey: "branch_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{row.original.branch_name}</span> },
    { accessorKey: "total_orders", header: t("dashboard.orders") },
    { accessorKey: "voided_orders", header: t("orderStatus.voided") },
    { accessorKey: "avg_order_value", header: t("analytics.aov"), cell: ({ row }) => <span className="tabular">{fmtMoney(row.original.avg_order_value)}</span> },
    ...activeMethods.map((m) => ({
      id: `${m.name}_revenue`,
      header: getLabel(m.name),
      cell: ({ row }: { row: { original: BranchComparison } }) => <span className="tabular text-sm">{fmtMoney((row.original.revenue_by_method as Record<string, number>)?.[m.name] ?? 0)}</span>,
    })),
    { accessorKey: "total_revenue", header: t("orders.totalRevenue"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{fmtMoney(row.original.total_revenue)}</span> },
  ];

  const chartData = report?.branches.map((b) => {
    const base: Record<string, any> = { name: b.branch_name };
    const byMethod = (b.revenue_by_method as Record<string, number>) || {};
    for (const m of activeMethods) {
      base[m.name] = piastresToEgp(byMethod[m.name] ?? 0);
    }
    return base;
  }) ?? [];

  const handleExport = () => {
    if (!report) return;
    exportToExcel({
      filename: "Branch-Comparison",
      sheets: [{
        name: "Branches",
        title: t("analytics.revenueByBranch"),
        columns: [
          { key: "name", header: t("common.name"), accessor: (b: BranchComparison) => b.branch_name, width: 24 },
          { key: "orders", header: t("dashboard.orders"), accessor: (b: BranchComparison) => b.total_orders, type: "integer", width: 12, total: true },
          { key: "voided", header: t("orderStatus.voided"), accessor: (b: BranchComparison) => b.voided_orders, type: "integer", width: 12, total: true },
          { key: "aov", header: t("analytics.aov"), accessor: (b: BranchComparison) => b.avg_order_value, type: "money", width: 14 },
          ...activeMethods.map((m) => ({
            key: m.name,
            header: getLabel(m.name),
            accessor: (b: BranchComparison) => (b.revenue_by_method as Record<string, number>)?.[m.name] ?? 0,
            type: "money" as const,
            width: 14,
            total: true,
          })),
          { key: "rev", header: t("orders.totalRevenue"), accessor: (b: BranchComparison) => b.total_revenue, type: "money", width: 16, total: true },
        ],
        rows: report.branches,
        totals: true,
      }],
    });
  };

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!report || report.branches.length === 0) return <EmptyState icon={BarChart2} title={t("analytics.noData")} />;

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByBranch")} onExport={handleExport}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} tickFormatter={(v) => fmtMoneyCompact(v * 100)} />
            <ReTooltip content={<ChartTooltip valueFormat="money" />} />
            <Legend />
            {activeMethods.map((m) => (
              <Bar
                key={m.name}
                dataKey={m.name}
                stackId="a"
                name={getLabel(m.name)}
                fill={colorMap[m.name] || "#ccc"}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <DataTable columns={cols} data={report.branches} onExport={handleExport} searchKey="branch_name" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Tab — stock bars
// ─────────────────────────────────────────────────────────────────────────────
function InventoryTab({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const { data: report, isLoading } = useBranchStockReport(branchId, { query: { enabled: !!branchId } });

  const handleExport = () => {
    if (!report) return;
    exportToExcel({
      filename: "Stock-Levels",
      sheets: [{
        name: "Stock",
        title: t("analytics.stockLevels"),
        columns: [
          { key: "name", header: t("recipes.ingredient"), accessor: (s: StockRow) => s.ingredient_name, width: 28 },
          { key: "unit", header: "Unit", accessor: (s: StockRow) => s.unit, width: 10 },
          { key: "stock", header: t("inventory.stock.currentStock"), accessor: (s: StockRow) => Number(s.current_stock), type: "number", width: 14 },
          { key: "threshold", header: t("inventory.stock.reorderAt"), accessor: (s: StockRow) => Number(s.reorder_threshold), type: "number", width: 14 },
          { key: "low", header: t("common.status"), accessor: (s: StockRow) => s.below_reorder ? t("inventory.stock.low") : t("inventory.stock.ok"), width: 12 },
        ],
        rows: report.items,
      }],
    });
  };

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!report || report.items.length === 0) return <EmptyState icon={Package} title={t("analytics.noData")} />;

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.stockLevels")} onExport={handleExport}>
        <div className="space-y-3 max-h-[520px] overflow-y-auto">
          {report.items.map((r) => {
            const pct = r.reorder_threshold > 0 ? Math.min(100, (Number(r.current_stock) / (Number(r.reorder_threshold) * 2)) * 100) : 100;
            return (
              <div key={r.branch_inventory_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.ingredient_name}</span>
                  <div className="flex items-center gap-2">
                    {r.below_reorder && <Badge variant="destructive" className="text-[10px]">{t("inventory.stock.low")}</Badge>}
                    <span className="tabular text-xs">{Number(r.current_stock).toFixed(2)} / {Number(r.reorder_threshold).toFixed(2)} {r.unit}</span>
                  </div>
                </div>
                <Progress value={pct} className={r.below_reorder ? "[&>div]:bg-destructive" : ""} />
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { t } = useTranslation();
  const { orgId, isSuperAdmin, isOrgAdmin, branchId: ctxBranch } = useCurrentContext();
  const { data: branches = [] } = useBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const [selBranch, setSelBranch] = useState<string>(ctxBranch ?? "");
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [gran, setGran] = useState<Granularity>("daily");
  const [tab, setTab] = useState<TabKey>("overview");

  useMemo(() => {
    if (!selBranch && branches.length > 0) setSelBranch(branches[0].id);
  }, [branches, selBranch]);

  const canCompareBranches = (isSuperAdmin || isOrgAdmin) && branches.length > 1;

  if (!orgId) return <PageShell title={t("analytics.title")} description={t("analytics.subtitle")}>{null}</PageShell>;

  return (
    <PageShell title={t("analytics.title")} description={t("analytics.subtitle")}>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selBranch} onValueChange={setSelBranch}>
              <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex rounded-lg border p-0.5 bg-muted">
              {(["hourly", "daily", "monthly"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGran(g)}
                  className={`px-3 py-1 text-xs rounded ${gran === g ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"}`}
                >
                  {t(`analytics.granularity.${g}`)}
                </button>
              ))}
            </div>
          </div>
          <DateRangePicker from={from} to={to} onChange={(f, tt) => { setFrom(f); setTo(tt); }} />
        </CardContent>
      </Card>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">{t("analytics.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="revenue">{t("analytics.tabs.revenue")}</TabsTrigger>
          <TabsTrigger value="items">{t("analytics.tabs.items")}</TabsTrigger>
          <TabsTrigger value="tellers">{t("analytics.tabs.tellers")}</TabsTrigger>
          {canCompareBranches && <TabsTrigger value="branches">{t("analytics.tabs.branches")}</TabsTrigger>}
          <TabsTrigger value="inventory">{t("analytics.tabs.inventory")}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {selBranch ? <OverviewTab branchId={selBranch} from={from} to={to} /> : <EmptyState icon={BarChart2} title={t("orders.selectBranch")} />}
        </TabsContent>
        <TabsContent value="revenue">
          {selBranch ? <RevenueTab branchId={selBranch} from={from} to={to} granularity={gran} /> : <EmptyState icon={BarChart2} title={t("orders.selectBranch")} />}
        </TabsContent>
        <TabsContent value="items">
          {selBranch ? <ItemsTab branchId={selBranch} from={from} to={to} /> : <EmptyState icon={Coffee} title={t("orders.selectBranch")} />}
        </TabsContent>
        <TabsContent value="tellers">
          {selBranch ? <TellersTab branchId={selBranch} from={from} to={to} /> : <EmptyState icon={Users} title={t("orders.selectBranch")} />}
        </TabsContent>
        {canCompareBranches && (
          <TabsContent value="branches">
            <BranchesTab orgId={orgId} from={from} to={to} />
          </TabsContent>
        )}
        <TabsContent value="inventory">
          {selBranch ? <InventoryTab branchId={selBranch} /> : <EmptyState icon={Package} title={t("orders.selectBranch")} />}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}