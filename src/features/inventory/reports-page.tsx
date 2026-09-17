import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, BarChart3, CalendarRange, CircleHelp, TrendingUp, Wallet } from "lucide-react";

import { ProgressBar } from "@/components/app/progress-bar";
import { DataTable } from "@/components/app/data-table";
import { SectionHeader } from "@/components/app/section-header";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ConsumptionRow, InventoryValuationReport, MaterialCostTrendRow, PoLeadTimeReport, ShrinkageRow,
  SupplierSpendRow, WasteReportRow,
} from "@/data/api/generated/models";
import { fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import type { ExcelColumn } from "@/lib/excel";

type Query<T> = { data: T | undefined; isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown };

/**
 * Builds the exportable sheet for whichever inventory report tab is active.
 * Used by Reports ▸ Operations, which owns its own header-level export.
 */
export function buildInventoryExportSheet(
  tab: string,
  isBranch: boolean,
  t: ReturnType<typeof useTranslation>["t"],
  data: {
    byCategory: { rows: [string, number][] };
    consumption: ConsumptionRow[] | undefined;
    shrinkage: ShrinkageRow[] | undefined;
    wasteReport: WasteReportRow[] | undefined;
    supplierSpend?: SupplierSpendRow[] | undefined;
    poLeadTime?: PoLeadTimeReport | undefined;
  },
) {
  type Row = Record<string, string | number | null>;
  let title = "";
  let cols: ExcelColumn<Row>[] = [];
  let rows: Row[] = [];
  const item = t("inventory.reports.ingredient", "Item");
  const reasonH = t("inventory.reports.reason", "Reason");
  const qtyH = t("inventory.reports.qty", "Quantity");
  const unitH = t("inventory.catalog.unit", "Unit");

  if (tab === "valuation") {
    title = t("inventory.reports.valuation", "Valuation");
    cols = [
      { header: t("inventory.reports.byCategory", "By category"), accessor: (r) => r.category, type: "text", width: 24 },
      { header: t("inventory.reports.totalValue", "Total value"), accessor: (r) => r.value, type: "money", width: 16 },
    ];
    rows = data.byCategory.rows.map(([cat, val]) => ({ category: cat, value: val }));
  } else if (tab === "consumption") {
    title = t("inventory.reports.consumption", "Consumption");
    cols = [
      { header: item, accessor: (r) => r.item, type: "text", width: 28 },
      { header: qtyH, accessor: (r) => r.qty, type: "number", width: 14 },
      { header: unitH, accessor: (r) => r.unit, type: "text", width: 10 },
      { header: t("inventory.reports.consumedValue", "Consumed value"), accessor: (r) => r.value, type: "money", width: 16 },
    ];
    rows = (data.consumption ?? []).map((r) => ({ item: r.ingredient_name, qty: r.consumed_qty, unit: fmtUnit(r.unit), value: r.consumed_value ?? null }));
  } else if (tab === "shrinkage") {
    title = t("inventory.reports.shrinkage", "Shrinkage");
    cols = [
      { header: item, accessor: (r) => r.item, type: "text", width: 28 },
      { header: reasonH, accessor: (r) => r.reason, type: "text", width: 18 },
      { header: qtyH, accessor: (r) => r.qty, type: "number", width: 14 },
      { header: unitH, accessor: (r) => r.unit, type: "text", width: 10 },
      { header: t("inventory.reports.value", "Value"), accessor: (r) => r.value, type: "money", width: 14 },
    ];
    rows = (data.shrinkage ?? []).map((r) => ({
      item: r.ingredient_name,
      reason: r.reason === "unexplained" ? t("inventory.varianceReasons.other", "Other") : t(`inventory.varianceReasons.${r.reason}`, r.reason),
      qty: r.shrinkage_qty, unit: fmtUnit(r.unit), value: r.shrinkage_value ?? null,
    }));
  } else if (tab === "waste") {
    title = t("inventory.reports.wasteReport", "Waste");
    cols = [
      { header: item, accessor: (r) => r.item, type: "text", width: 28 },
      { header: reasonH, accessor: (r) => r.reason, type: "text", width: 18 },
      { header: qtyH, accessor: (r) => r.qty, type: "number", width: 14 },
      { header: unitH, accessor: (r) => r.unit, type: "text", width: 10 },
      { header: t("inventory.reports.wasteValue", "Waste value"), accessor: (r) => r.value, type: "money", width: 14 },
    ];
    rows = (data.wasteReport ?? []).map((r) => ({
      item: r.ingredient_name, reason: t(`inventory.waste.reasons.${r.reason}`, r.reason),
      qty: r.waste_qty, unit: fmtUnit(r.unit), value: r.waste_value ?? null,
    }));
  } else if (tab === "supplierSpend") {
    title = t("inventory.reports.supplierSpend", "Supplier spend");
    cols = [
      { header: t("inventory.reports.supplier", "Supplier"), accessor: (r) => r.supplier, type: "text", width: 28 },
      { header: t("inventory.reports.orders", "Orders"), accessor: (r) => r.orders, type: "number", width: 12 },
      { header: t("inventory.reports.totalSpend", "Total spend"), accessor: (r) => r.value, type: "money", width: 16 },
    ];
    rows = (data.supplierSpend ?? []).map((r) => ({ supplier: r.supplier_name, orders: r.orders, value: r.total_spend }));
  } else {
    title = t("inventory.reports.poLeadTime", "PO lead time");
    cols = [
      { header: t("inventory.reports.supplier", "Supplier"), accessor: (r) => r.supplier, type: "text", width: 28 },
      { header: t("inventory.reports.ordersReceived", "Orders received"), accessor: (r) => r.orders, type: "number", width: 14 },
      { header: t("inventory.reports.avgLeadDays", "Avg lead time (days)"), accessor: (r) => r.value, type: "number", width: 18 },
    ];
    rows = (data.poLeadTime?.by_supplier ?? []).map((r) => ({ supplier: r.supplier_name, orders: r.orders_received, value: r.avg_lead_time_days }));
  }
  const scopeLabel = isBranch ? t("inventory.reports.branch", "This branch") : t("inventory.reports.org", "Whole organization");
  return { title, subtitle: scopeLabel, rows: rows as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] };
}

/** Total stock value plus a by-category breakdown. `byCategory` is computed by
 *  the caller (it's also what the page's own Excel export sends) and handed
 *  down rather than recomputed here. */
export function ValuationTab({ valuation, catalogLoading, byCategory }: {
  valuation: Query<InventoryValuationReport>;
  catalogLoading: boolean;
  byCategory: { rows: [string, number][]; max: number };
}) {
  const { t } = useTranslation();
  if (valuation.isError) {
    return (
      <ErrorState
        title={t("inventory.reports.valuationFailed", "Couldn't load stock valuation")}
        onRetry={() => void valuation.refetch()}
      />
    );
  }
  return (
    <>
      <LedgerStrip
        className="lg:max-w-2xl"
        items={[
          { key: "value", label: t("inventory.reports.totalValue", "Total value"), value: valuation.data?.total_value ?? 0, formatType: "money", icon: Wallet, loading: valuation.isLoading },
          { key: "unknown", label: t("inventory.reports.unknownCostLabel", "Unknown cost"), value: valuation.data?.unknown_cost_count ?? 0, icon: CircleHelp, accent: (valuation.data?.unknown_cost_count ?? 0) > 0 ? "warning" : "neutral", loading: valuation.isLoading },
        ] satisfies LedgerItem[]}
      />
      <section className="space-y-3">
        <SectionHeader title={t("inventory.reports.byCategory", "By category")} />
        {valuation.isLoading || catalogLoading ? (
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-20" /></div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : byCategory.rows.length === 0 ? (
          <EmptyState className="py-8" title={t("inventory.reports.noValuation", "Stock value by category appears after a branch is counted.")} />
        ) : (
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            {byCategory.rows.map(([cat, val]) => (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium">{cat}</span>
                  <bdi className="font-mono tabular">{fmtMoney(val)}</bdi>
                </div>
                <ProgressBar value={val} max={byCategory.max} ariaLabel={cat} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function ConsumptionTab({ consumption, noData }: { consumption: Query<ConsumptionRow[]>; noData: string }) {
  const { t } = useTranslation();
  return (
    <ReportTable
      query={consumption}
      empty={noData}
      head={[
        { label: t("inventory.reports.ingredient", "Item") },
        { label: t("inventory.reports.qty", "Quantity"), numeric: true },
        { label: t("inventory.reports.consumedValue", "Consumed value"), numeric: true },
      ]}
      rows={(consumption.data ?? []).map((r) => ({
        key: r.org_ingredient_id,
        cells: [r.ingredient_name, `${fmtNumber(r.consumed_qty)} ${fmtUnit(r.unit)}`, fmtMoney(r.consumed_value)],
      }))}
    />
  );
}

export function ShrinkageTab({ shrinkage, noData }: { shrinkage: Query<ShrinkageRow[]>; noData: string }) {
  const { t } = useTranslation();
  return (
    <ReportTable
      query={shrinkage}
      empty={noData}
      head={[
        { label: t("inventory.reports.ingredient", "Item") },
        { label: t("inventory.reports.reason", "Reason") },
        { label: t("inventory.reports.qty", "Quantity"), numeric: true },
        { label: t("inventory.reports.value", "Value"), numeric: true },
      ]}
      rows={(shrinkage.data ?? []).map((r, i) => ({
        key: `${r.org_ingredient_id}-${r.reason}-${i}`,
        cells: [
          r.ingredient_name,
          r.reason === "unexplained" ? t("inventory.varianceReasons.other", "Other") : t(`inventory.varianceReasons.${r.reason}`, r.reason),
          `${fmtNumber(r.shrinkage_qty)} ${fmtUnit(r.unit)}`,
          fmtMoney(r.shrinkage_value),
        ],
      }))}
    />
  );
}

export function WasteTab({ wasteReport, noData }: { wasteReport: Query<WasteReportRow[]>; noData: string }) {
  const { t } = useTranslation();
  return (
    <ReportTable
      query={wasteReport}
      empty={noData}
      head={[
        { label: t("inventory.reports.ingredient", "Item") },
        { label: t("inventory.reports.reason", "Reason") },
        { label: t("inventory.reports.qty", "Quantity"), numeric: true },
        { label: t("inventory.reports.wasteValue", "Waste value"), numeric: true },
      ]}
      rows={(wasteReport.data ?? []).map((r, i) => ({
        key: `${r.org_ingredient_id}-${r.reason}-${i}`,
        cells: [r.ingredient_name, t(`inventory.waste.reasons.${r.reason}`, r.reason), `${fmtNumber(r.waste_qty)} ${fmtUnit(r.unit)}`, fmtMoney(r.waste_value)],
      }))}
    />
  );
}

export function SupplierSpendTab({ supplierSpend, noData }: { supplierSpend: Query<SupplierSpendRow[]>; noData: string }) {
  const { t } = useTranslation();
  return (
    <ReportTable
      query={supplierSpend}
      empty={noData}
      head={[
        { label: t("inventory.reports.supplier", "Supplier") },
        { label: t("inventory.reports.orders", "Orders"), numeric: true },
        { label: t("inventory.reports.totalSpend", "Total spend"), numeric: true },
      ]}
      rows={(supplierSpend.data ?? []).map((r, i) => ({
        key: r.supplier_id ?? `${r.supplier_name}-${i}`,
        cells: [r.supplier_name, fmtNumber(r.orders), fmtMoney(r.total_spend)],
      }))}
    />
  );
}

export function PoLeadTimeTab({ poLeadTime, noData }: { poLeadTime: Query<PoLeadTimeReport>; noData: string }) {
  const { t } = useTranslation();
  const rows = poLeadTime.data?.by_supplier ?? [];
  return (
    <div className="space-y-4">
      <LedgerStrip
        className="lg:max-w-md"
        items={[{
          key: "overall",
          label: t("inventory.reports.avgLeadDays", "Avg lead time (days)"),
          value: fmtNumber(poLeadTime.data?.overall_avg_days ?? 0, { maximumFractionDigits: 1 }),
          icon: CalendarRange,
          loading: poLeadTime.isLoading,
        }]}
      />
      <ReportTable
        query={poLeadTime}
        empty={noData}
        head={[
          { label: t("inventory.reports.supplier", "Supplier") },
          { label: t("inventory.reports.ordersReceived", "Orders received"), numeric: true },
          { label: t("inventory.reports.avgLeadDays", "Avg lead time (days)"), numeric: true },
        ]}
        rows={rows.map((r, i) => ({
          key: r.supplier_id ?? `${r.supplier_name}-${i}`,
          cells: [r.supplier_name, fmtNumber(r.orders_received), fmtNumber(r.avg_lead_time_days, { maximumFractionDigits: 1 })],
        }))}
      />
    </div>
  );
}

/** Ingredients whose current supplier has raised the price 3+ deliveries in
 *  a row, with a cheaper alternative supplier named when the data shows one. */
export function MaterialCostTrendTab({ trend, noData }: { trend: Query<MaterialCostTrendRow[]>; noData: string }) {
  const { t } = useTranslation();
  const rows = useMemo(() => trend.data ?? [], [trend.data]);
  const columns = useMemo<ColumnDef<MaterialCostTrendRow>[]>(() => [
    {
      id: "ingredient",
      header: t("inventory.reports.ingredient", "Item"),
      meta: { label: t("inventory.reports.ingredient", "Item"), phone: "title" },
      cell: ({ row: { original: r } }) => <span className="font-medium">{r.ingredient_name}</span>,
    },
    {
      id: "supplier",
      header: t("inventory.reports.supplier", "Supplier"),
      meta: { label: t("inventory.reports.supplier", "Supplier") },
      cell: ({ row: { original: r } }) => r.current_supplier_name,
    },
    {
      id: "cost",
      header: t("inventory.reports.currentCost", "Current cost"),
      meta: { label: t("inventory.reports.currentCost", "Current cost"), numeric: true },
      cell: ({ row: { original: r } }) => fmtMoney(r.current_cost),
    },
    {
      id: "streak",
      header: t("inventory.reports.priceStreak", "Price trend"),
      meta: { label: t("inventory.reports.priceStreak", "Price trend"), numeric: true },
      cell: ({ row: { original: r } }) => (
        <Badge variant="destructive" className="gap-1">
          <TrendingUp className="size-3" aria-hidden />
          {t("inventory.reports.streakBadge", "+{{pct}}% over {{count}} deliveries", {
            pct: fmtNumber(r.pct_increase, { maximumFractionDigits: 1 }),
            count: r.streak_length,
          })}
        </Badge>
      ),
    },
    {
      id: "suggestion",
      header: t("inventory.reports.suggestion", "Suggestion"),
      meta: { label: t("inventory.reports.suggestion", "Suggestion") },
      cell: ({ row: { original: r } }) => (
        r.cheaper_supplier_name ? (
          <Badge variant="secondary" className="gap-1">
            <ArrowRight className="size-3" aria-hidden />
            {t("inventory.reports.switchTo", "Switch to {{supplier}} ({{cost}})", {
              supplier: r.cheaper_supplier_name,
              cost: fmtMoney(r.cheaper_cost ?? 0),
            })}
          </Badge>
        ) : <span className="text-muted-foreground">—</span>
      ),
    },
  ], [t]);

  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={trend.isLoading}
      error={trend.error}
      onRetry={() => void trend.refetch()}
      getRowId={(r) => r.org_ingredient_id}
      pageSize={25}
      hideViewOptions
      emptyState={<EmptyState icon={TrendingUp} title={noData} description={t("inventory.reports.noCostTrend", "Nothing has had 3 straight price rises from its current supplier this period.")} />}
    />
  );
}

type ReportRow = { key: string; cells: string[] };

function ReportTable({ head, rows, query, empty }: {
  head: { label: string; numeric?: boolean }[];
  rows: ReportRow[];
  query: { isLoading: boolean; error: unknown; refetch: () => unknown };
  empty: string;
}) {
  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () =>
      head.map((h, i) => ({
        id: `c${i}`,
        header: h.label,
        accessorFn: (r) => r.cells[i],
        meta: { label: h.label, numeric: h.numeric, phone: i === 0 ? "title" : undefined },
        cell: ({ row }) => (i === 0 ? <span className="font-medium">{row.original.cells[i]}</span> : row.original.cells[i]),
      })),
    [head],
  );
  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      getRowId={(r) => r.key}
      pageSize={25}
      hideViewOptions
      emptyState={<EmptyState icon={BarChart3} title={empty} />}
    />
  );
}
