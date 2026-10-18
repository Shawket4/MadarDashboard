// Operations ▸ Items, Tellers, Waiters and Branches: who and what moved the
// volume. Laid out like the Overview (report-kit): a chart card, then the
// detail table in a titled card. Items ranks items and add-ons in
// RankedTable (./ranked-table), the kit's ranked table.
import { useCallback, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ColumnDef } from "@tanstack/react-table";

import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { useChartMotion } from "@/lib/motion";
import { fmtMoney, fmtMoneyCompact, fmtMoneyRange, fmtNumber, fmtPercent } from "@/lib/format";
import {
  useBranchAddonSales, useBranchCombinedItemSales, useBranchSales, useBranchTellerStats, useBranchWaiterStats,
  useListMenuItems, useOrgBranchComparison,
} from "@/data/api/generated/api";
import type { AddonSalesRow } from "@/data/api/generated/models";
import { useExcludedItems } from "@/components/app/exclude-items-control";
import { useOrgId } from "@/hooks/use-org-id";
import { type Range, tName } from "@/features/analytics/lib";
import { addonSalesParams, itemSalesParams, overviewParams, tellerStatsParams } from "@/features/analytics/queries";
import {
  CHART_GRID, CHART_GRID_VERTICAL, ChartBody, ChartFrame, MAX_BAR_SIZE, ReportStack, TableCard,
  type ChartState,
} from "./report-kit";
import { RankedTable, type RankedColumn } from "./ranked-table";
import { avgPrice, fmtAvgPrice, fmtCount, humanizeType, shareOf } from "./ranked-table-util";
import { itemRows, type ItemRow } from "./items-rows";

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
/** The most rows the items and add-ons queries return (analytics/queries.ts). */
const ITEMS_LIMIT = itemSalesParams({}).limit;
const ADDONS_LIMIT = addonSalesParams({}).limit;

type AddonRow = AddonSalesRow;

/** Every name a row goes by, so a search in either language finds it. */
const namesOf = (name: string, translations: unknown): string[] => [
  name,
  ...Object.values((translations ?? {}) as Record<string, unknown>).filter((v): v is string => typeof v === "string"),
];

export function ItemsTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const orgId = useOrgId();
  const items = useBranchCombinedItemSales(branchId, itemSalesParams(range), { query: { enabled: !!branchId } });
  const addons = useBranchAddonSales(branchId, addonSalesParams(range), { query: { enabled: !!branchId } });
  // Revenue and category: the Overview's sales report, asked with the
  // Overview's own parameters (its excluded items included) so both tabs
  // share one cached read.
  const [excludedItems] = useExcludedItems();
  const sales = useBranchSales(branchId, overviewParams(range, excludedItems), { query: { enabled: !!branchId } });
  // Pictures, the menu price (sizes) and a category the report lacks: the full
  // menu list the app already caches (the menu studio's and the combo
  // editor's read). The table never waits for it, nor fails with it.
  const menu = useListMenuItems({ org_id: orgId ?? "", full: true }, { query: { enabled: !!orgId, staleTime: 5 * 60_000 } });
  const rows = useMemo(
    () => itemRows({ items: items.data ?? [], sales: sales.data, menu: menu.data, lang }),
    [items.data, sales.data, menu.data, lang],
  );
  const addonRows = useMemo(() => addons.data ?? [], [addons.data]);

  const itemsRevenue = useMemo(() => rows.reduce((s, r) => s + (r.revenue ?? 0), 0), [rows]);
  const missingRevenue = rows.some((r) => r.revenue === null);
  const addonRevenue = useMemo(() => addonRows.reduce((s, r) => s + r.revenue, 0), [addonRows]);

  const itemColumns = useMemo<RankedColumn<ItemRow>[]>(() => [
    { id: "qty", header: t("reports.operations.ranked.sold", "Sold"), sortValue: (r) => r.units, cell: (r) => fmtCount(r.units), phoneOrder: 3 },
    { id: "revenue", header: t("reports.operations.ranked.revenue", "Revenue"), sortValue: (r) => r.revenue, cell: (r) => fmtMoney(r.revenue), strong: true, phoneOrder: 1 },
    { id: "share", header: t("reports.operations.ranked.shareOfRevenue", "Share of revenue"), share: (r) => r.share, phoneOrder: 2 },
    { id: "price", header: t("reports.operations.ranked.price", "Price"), sortValue: (r) => r.price?.min ?? null, cell: (r) => fmtMoneyRange(r.price?.min, r.price?.max), phoneOrder: 4 },
    { id: "extra", header: t("reports.operations.ranked.avgExtra", "Avg. extra"), sortValue: (r) => r.avgExtra, cell: (r) => fmtMoney(r.avgExtra), phoneOrder: 5 },
  ], [t]);
  const itemCategory = useMemo(() => ({
    label: t("reports.operations.ranked.category", "Category"),
    allLabel: t("reports.operations.ranked.allCategories", "All categories"),
    of: (r: ItemRow) => r.category,
  }), [t]);

  const addonColumns = useMemo<RankedColumn<AddonRow>[]>(() => [
    { id: "qty", header: t("reports.operations.ranked.sold", "Sold"), sortValue: (r) => r.quantity_sold, cell: (r) => fmtCount(r.quantity_sold), phoneOrder: 3 },
    { id: "revenue", header: t("reports.operations.ranked.revenue", "Revenue"), sortValue: (r) => r.revenue, cell: (r) => fmtMoney(r.revenue), strong: true, phoneOrder: 1 },
    { id: "share", header: t("reports.operations.ranked.shareOfRevenue", "Share of revenue"), share: (r) => shareOf(r.revenue, addonRevenue), phoneOrder: 2 },
    { id: "avg", header: t("reports.operations.ranked.avgPrice", "Avg. price"), sortValue: (r) => avgPrice(r.revenue, r.quantity_sold), cell: (r) => fmtAvgPrice(r.revenue, r.quantity_sold), phoneOrder: 4 },
  ], [t, addonRevenue]);

  const typeLabel = useCallback(
    (type: string) => t(`menu.addonTypes.${type}`, { defaultValue: humanizeType(type) }),
    [t],
  );
  const addonCategory = useMemo(() => ({
    label: t("reports.operations.ranked.type", "Type"),
    allLabel: t("reports.operations.ranked.allTypes", "All types"),
    of: (r: AddonRow) => r.addon_type,
    labelOf: typeLabel,
  }), [t, typeLabel]);

  const itemId = useCallback((r: ItemRow) => r.id, []);
  const addonId = useCallback((r: AddonRow) => r.addon_item_id, []);
  const byItemRevenue = useCallback((r: ItemRow) => r.revenue, []);
  const byRevenue = useCallback((r: AddonRow) => r.revenue, []);

  return (
    <ReportStack>
      <RankedTable
        title={t("analytics.tabs.items", "Items")}
        description={rows.length > 0 ? t("reports.operations.ranked.itemsSummary", "{{count}} items, {{revenue}}", { count: rows.length, revenue: fmtMoney(itemsRevenue) }) : undefined}
        rows={rows}
        getRowId={itemId}
        rankMetric={byItemRevenue}
        item={{
          header: t("reports.operations.ranked.item", "Item"),
          name: (r) => r.name,
          alsoMatches: (r) => r.names,
          sub: (r) => r.category,
          thumb: (r) => r.image,
        }}
        columns={itemColumns}
        category={itemCategory}
        searchPlaceholder={t("reports.operations.ranked.searchItems", "Search items")}
        loading={items.isLoading || sales.isLoading}
        error={items.isError || sales.isError}
        onRetry={() => {
          if (items.isError) void items.refetch();
          if (sales.isError) void sales.refetch();
        }}
        footnote={[
          rows.length >= ITEMS_LIMIT ? t("reports.operations.ranked.topNote", "The top {{count}} by volume; shares are of these.", { count: ITEMS_LIMIT }) : null,
          t("reports.operations.ranked.extraNote", "Price is today's menu (a range when the item has sizes). Avg. extra is what customers paid per unit on top of the menu price of the size they bought (add-ons, swaps, options), before discounts."),
          missingRevenue ? t("reports.operations.ranked.noRevenueNote", "— means the period's sales report does not list the item yet (it sold after the report was read). Refresh to fill it in.") : null,
        ].filter(Boolean).join(" ") || undefined}
      />
      <RankedTable
        title={t("analytics.addonSales", "Addon Sales")}
        description={addonRows.length > 0 ? t("reports.operations.ranked.addonsSummary", "{{count}} add-ons, {{revenue}}", { count: addonRows.length, revenue: fmtMoney(addonRevenue) }) : undefined}
        rows={addonRows}
        getRowId={addonId}
        rankMetric={byRevenue}
        item={{
          header: t("reports.operations.ranked.addon", "Add-on"),
          name: (r) => tName(r.addon_name, r.addon_name_translations, lang),
          alsoMatches: (r) => namesOf(r.addon_name, r.addon_name_translations),
          sub: (r) => typeLabel(r.addon_type),
        }}
        columns={addonColumns}
        category={addonCategory}
        searchPlaceholder={t("reports.operations.ranked.searchAddons", "Search add-ons")}
        loading={addons.isLoading}
        error={addons.isError}
        onRetry={() => void addons.refetch()}
        footnote={addonRows.length >= ADDONS_LIMIT ? t("reports.operations.ranked.topNote", "The top {{count}} by volume; shares are of these.", { count: ADDONS_LIMIT }) : undefined}
      />
    </ReportStack>
  );
}

// ── Tellers ──────────────────────────────────────────────────────────────────
export function TellersTab({ branchId, range }: { branchId: string; range: Range }) {
  const { t } = useTranslation();
  const q = useBranchTellerStats(branchId, tellerStatsParams(range), { query: { enabled: !!branchId } });
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
