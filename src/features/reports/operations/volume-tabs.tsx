// Operations ▸ Items, Tellers, Waiters and Branches: who and what moved the
// volume. Laid out like the Overview (report-kit): a chart card, then the
// detail table in a titled card.
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ColumnDef } from "@tanstack/react-table";

import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { useChartMotion } from "@/lib/motion";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtPercent } from "@/lib/format";
import {
  useBranchAddonSales, useBranchCombinedItemSales, useBranchTellerStats, useBranchWaiterStats,
  useOrgBranchComparison,
} from "@/data/api/generated/api";
import { type Range, tName } from "@/features/analytics/lib";
import {
  CHART_GRID, CHART_GRID_VERTICAL, ChartBody, ChartFrame, ChartGrid, MAX_BAR_SIZE, ReportStack, TableCard,
  type ChartState,
} from "./report-kit";

/** Revenue ranked by person, top ten, as horizontal bars (names read along the axis). */
function RevenueByNameCard({ title, rows, state }: { title: ReactNode; rows: { name: string; revenue: number }[]; state: ChartState }) {
  const chartMotion = useChartMotion();
  return (
    <ChartCard title={title}>
      <ChartBody state={state}>
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
              {CHART_GRID_VERTICAL}
              <XAxis type="number" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} />
              <YAxis type="category" dataKey="name" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={110} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(v)} />} />
              <Bar dataKey="revenue" fill={chartColor(0)} radius={[0, 4, 4, 0]} maxBarSize={MAX_BAR_SIZE} {...chartMotion} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartBody>
    </ChartCard>
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
    <ReportStack>
      <ChartGrid>
        <TableCard
          title={t("analytics.tabs.items", "Items")}
          columns={itemCols} data={rows} getRowId={(r) => r.item_id} pageSize={50}
          loading={items.isLoading} error={items.isError} onRetry={() => void items.refetch()}
        />
        <TableCard
          title={t("analytics.addonSales", "Addon Sales")}
          columns={addonCols} data={addons.data ?? []} getRowId={(r) => r.addon_item_id}
          loading={addons.isLoading} error={addons.isError} onRetry={() => void addons.refetch()}
        />
      </ChartGrid>
    </ReportStack>
  );
}

// ── Tellers ──────────────────────────────────────────────────────────────────
export function TellersTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t } = useTranslation();
  const q = useBranchTellerStats(branchId, { ...range, limit: 50 }, { query: { enabled: !!branchId } });
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const tellerCols = useMemo<ColumnDef<(typeof rows)[number]>[]>(() => [
    { id: "name", header: t("orders.teller", "Teller"), meta: { label: t("orders.teller", "Teller"), phone: "title" }, cell: ({ row: { original: r } }) => <span className="font-medium">{r.teller_name}</span> },
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
    <ReportStack>
      <RevenueByNameCard
        title={t("analytics.revenueByTeller", "Revenue by Teller")}
        rows={chart}
        state={{ loading: q.isLoading, error: q.isError, empty: chart.length === 0, onRetry: () => void q.refetch() }}
      />
      <TableCard
        title={t("analytics.tellerDetails", "Teller Details")}
        columns={tellerCols} data={rows} pageSize={50}
        loading={q.isLoading} error={q.isError} onRetry={() => void q.refetch()}
      />
    </ReportStack>
  );
}

// ── Waiters ──────────────────────────────────────────────────────────────────
export function WaitersTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t } = useTranslation();
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
    <ReportStack>
      <RevenueByNameCard
        title={t("analytics.revenueByWaiter", "Revenue by Waiter")}
        rows={chart}
        state={{ loading: q.isLoading, error: q.isError, empty: chart.length === 0, onRetry: () => void q.refetch() }}
      />
      <TableCard
        title={t("analytics.waiterDetails", "Waiter Details")}
        columns={waiterCols} data={rows} pageSize={50}
        loading={q.isLoading} error={q.isError} onRetry={() => void q.refetch()}
        // Waiter-attributed orders are a subset (teller-direct + delivery never carry one): caption the gap so totals don't look short vs Overview.
        footnote={!q.isLoading && !q.isError && q.data && q.data.total_orders > 0
          ? t("analytics.waiterCoverage", "{{attributed}} of {{total}} orders came through waiters", {
            attributed: fmtNumber(q.data.attributed_orders),
            total: fmtNumber(q.data.total_orders),
          })
          : undefined}
      />
    </ReportStack>
  );
}

// ── Branches (org comparison) ────────────────────────────────────────────────
export function BranchesTab({ orgId, range }: { orgId: string; range: Range }) {
  const { t } = useTranslation();
  const chartMotion = useChartMotion();
  const q = useOrgBranchComparison(orgId, range, { query: { enabled: !!orgId } });
  const rows = useMemo(() => q.data?.branches ?? [], [q.data]);
  const branchCols = useMemo<ColumnDef<(typeof rows)[number]>[]>(() => [
    { id: "name", header: t("orders.branch", "Branch"), meta: { label: t("orders.branch", "Branch"), phone: "title" }, cell: ({ row: { original: r } }) => <span className="font-medium">{r.branch_name}</span> },
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
    <ReportStack>
      <ChartCard title={t("analytics.revenueByBranch", "Revenue by Branch")}>
        <ChartBody state={{ loading: q.isLoading, error: q.isError, empty: chart.length === 0, onRetry: () => void q.refetch() }}>
          <ChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
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
      <TableCard
        title={t("analytics.branchDetails", "Branch Details")}
        columns={branchCols} data={rows} pageSize={50}
        loading={q.isLoading} error={q.isError} onRetry={() => void q.refetch()}
      />
    </ReportStack>
  );
}
