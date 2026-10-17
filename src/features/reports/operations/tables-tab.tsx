// Operations ▸ Tables: which tables turn, how long parties stay, and what each
// table and each guest is worth.
//
// Every figure comes from the metrics layer's `tables` dataset: one row per
// settled bill eaten at a table, carrying the sale's own table, covers and the
// moment the party sat down. Branch and period come from the global scope bar
// (and the report's header); the section filter narrows the per-table ledger
// and its chart in place. Laid out like the Overview (report-kit).
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Armchair, Clock, Coins, RotateCcw, UserRound, Users } from "lucide-react";

import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { listFloorTables, runMetricsQuery } from "@/data/api/generated/api";
import { useScope } from "@/data/scope/use-scope";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtWireTime } from "@/lib/format";
import { useChartMotion } from "@/lib/motion";
import { useCustomerSheet } from "@/features/customers/use-customer-sheet";
import { TableHistory } from "@/features/floor/table-history";
import {
  SPECS,
  byTableSpec,
  fmtDwell,
  sectionsOf,
  toHourSeries,
  toSummary,
  toTableRows,
  type DwellUnits,
  type TableRow,
} from "@/features/insights/tables-util";
import { CHART_GRID, ChartBody, ChartFrame, ChartGrid, MAX_BAR_SIZE, ReportStack, TableCard } from "./report-kit";

const ALL = "__all__";

export function TablesTab() {
  const { t, i18n } = useTranslation();
  const chartMotion = useChartMotion();
  const { branchId, from, to } = useScope();
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en";
  const [section, setSection] = useState<string>(ALL);
  const [open, setOpen] = useState<TableRow | null>(null);
  // A name in a table's history opens the customer.
  const customerSheet = useCustomerSheet();

  const q = useQuery({
    queryKey: ["metrics", "tables", branchId, from, to, locale],
    queryFn: ({ signal }) =>
      runMetricsQuery(
        {
          locale,
          period: from || to ? { from, to } : { preset: "last_30_days" },
          widgets: [
            { key: "summary", spec: SPECS.summary },
            { key: "byTable", spec: byTableSpec(!!branchId) },
            { key: "byHour", spec: SPECS.byHour },
          ],
        },
        undefined,
        signal,
      ),
  });

  // A table's history is addressed by id; the metrics rows carry labels. Only
  // a single branch has unambiguous labels, so the lookup waits for one.
  const floor = useQuery({
    queryKey: ["floor-tables", branchId],
    queryFn: ({ signal }) => listFloorTables({ branch_id: branchId! }, undefined, signal),
    enabled: !!branchId,
  });

  const summary = toSummary(q.data?.results.summary);
  const allRows = useMemo(() => toTableRows(q.data?.results.byTable), [q.data]);
  const sections = useMemo(() => sectionsOf(allRows), [allRows]);
  const rows = useMemo(
    () => (section === ALL ? allRows : allRows.filter((r) => r.section === section)),
    [allRows, section],
  );
  const hours = useMemo(() => toHourSeries(q.data?.results.byHour), [q.data]);
  const topRevenue = useMemo(
    () => [...rows].sort((a, b) => b.table_revenue - a.table_revenue).slice(0, 12),
    [rows],
  );

  const openTableId = useMemo(() => {
    if (!open || !floor.data) return null;
    return floor.data.find((ft) => ft.label === open.table)?.id ?? null;
  }, [open, floor.data]);

  const dwellUnits = useMemo<DwellUnits>(() => ({
    minutes: (m) => t("tablesInsights.dwellMinutes", "{{m}}m", { m }),
    hours: (h) => t("tablesInsights.dwellHours", "{{h}}h", { h }),
    hoursMinutes: (h, m) => t("tablesInsights.dwellHoursMinutes", "{{h}}h {{m}}m", { h, m }),
  }), [t]);

  // One answer for the whole tab: a widget that failed fails every card, as a
  // failed query does on the Overview. A failed KPI reads "—", never 0.
  const failed = q.isError || (!!q.data && Object.values(q.data.results).some((r) => r.status === "error"));
  const retry = () => void q.refetch();
  const kpi = (item: LedgerItem): LedgerItem =>
    failed ? { ...item, value: "—", formatType: undefined, hint: undefined } : item;

  const kpis = ([
    { key: "turns", label: t("tablesInsights.turns", "Turns"), icon: RotateCcw, value: summary?.turns ?? 0, formatType: "number", loading: q.isLoading,
      hint: t("tablesInsights.perDay", "{{value}} per table a day", { value: fmtNumber(summary?.turns_per_day ?? 0, { maximumFractionDigits: 2 }) }) },
    { key: "covers", label: t("tablesInsights.covers", "Covers"), icon: Users, value: summary?.covers ?? 0, formatType: "number", loading: q.isLoading },
    { key: "revenue", label: t("tablesInsights.revenue", "Table revenue"), icon: Coins, value: summary?.table_revenue ?? 0, formatType: "money", loading: q.isLoading },
    { key: "per_table", label: t("tablesInsights.revenuePerTable", "Revenue per table"), icon: Armchair, value: summary?.revenue_per_table ?? 0, formatType: "money", loading: q.isLoading,
      hint: t("tablesInsights.tablesUsed", "{{count}} tables used", { count: summary?.active_tables ?? 0 }) },
    { key: "per_cover", label: t("tablesInsights.revenuePerCover", "Revenue per cover"), icon: UserRound, value: summary?.revenue_per_cover ?? 0, formatType: "money", loading: q.isLoading },
    { key: "dwell", label: t("tablesInsights.avgDwell", "Average stay"), icon: Clock, value: fmtDwell(summary?.avg_dwell_minutes ?? 0, dwellUnits), loading: q.isLoading },
  ] satisfies LedgerItem[]).map(kpi);

  const columns = useMemo<ColumnDef<TableRow>[]>(
    () => [
      { accessorKey: "table", header: t("tablesInsights.table", "Table"), meta: { label: t("tablesInsights.table", "Table"), phone: "title" }, cell: ({ row }) => <span className="font-medium">{row.original.table}</span> },
      { accessorKey: "section", header: t("tablesInsights.section", "Section"), meta: { label: t("tablesInsights.section", "Section") } },
      ...(branchId ? [] : [{ accessorKey: "branch", header: t("tablesInsights.branch", "Branch"), meta: { label: t("tablesInsights.branch", "Branch") } } as ColumnDef<TableRow>]),
      { accessorKey: "turns", meta: { label: t("tablesInsights.turns", "Turns"), numeric: true }, header: t("tablesInsights.turns", "Turns"), cell: ({ row }) => fmtNumber(row.original.turns) },
      { accessorKey: "turns_per_day", meta: { label: t("tablesInsights.turnsPerDay", "Turns / day"), numeric: true }, header: t("tablesInsights.turnsPerDay", "Turns / day"), cell: ({ row }) => fmtNumber(row.original.turns_per_day, { maximumFractionDigits: 2 }) },
      { accessorKey: "covers", meta: { label: t("tablesInsights.covers", "Covers"), numeric: true }, header: t("tablesInsights.covers", "Covers"), cell: ({ row }) => fmtNumber(row.original.covers) },
      { accessorKey: "table_revenue", meta: { label: t("tablesInsights.revenue", "Table revenue"), numeric: true }, header: t("tablesInsights.revenue", "Table revenue"), cell: ({ row }) => <span className="font-semibold">{fmtMoney(row.original.table_revenue)}</span> },
      { accessorKey: "revenue_per_cover", meta: { label: t("tablesInsights.revenuePerCover", "Revenue per cover"), numeric: true }, header: t("tablesInsights.revenuePerCover", "Revenue per cover"), cell: ({ row }) => fmtMoney(row.original.revenue_per_cover) },
      { accessorKey: "avg_dwell_minutes", meta: { label: t("tablesInsights.avgDwell", "Average stay"), numeric: true }, header: t("tablesInsights.avgDwell", "Average stay"), cell: ({ row }) => fmtDwell(row.original.avg_dwell_minutes, dwellUnits) },
    ],
    [t, branchId, dwellUnits],
  );

  const emptyTitle = t("tablesInsights.empty", "No table sales in this period");
  const sectionName = section === ALL ? null : section;

  return (
    <ReportStack>
      <LedgerStrip items={kpis} />

      <ChartGrid>
        <ChartCard title={t("tablesInsights.busiestHours", "Busiest hours")} description={t("tablesInsights.busiestHoursHint", "Parties settled at tables, by hour")}>
          <ChartBody state={{ loading: q.isLoading, error: failed, empty: hours.length === 0, onRetry: retry }} emptyTitle={emptyTitle}>
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hours} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  {CHART_GRID}
                  <XAxis dataKey="hour" tickFormatter={fmtWireTime} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v, n) => `${n === "covers" ? t("tablesInsights.covers", "Covers") : t("tablesInsights.turns", "Turns")}: ${fmtNumber(Number(v))}`} />} />
                  <Bar dataKey="turns" fill={chartColor(1)} radius={[4, 4, 0, 0]} maxBarSize={MAX_BAR_SIZE} {...chartMotion} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </ChartBody>
        </ChartCard>

        {/* Narrowed by the section filter, so it says which section it shows. */}
        <ChartCard title={t("tablesInsights.topRevenue", "Revenue by table")} description={sectionName ?? undefined}>
          <ChartBody state={{ loading: q.isLoading, error: failed, empty: topRevenue.length === 0, onRetry: retry }} emptyTitle={emptyTitle}>
            <ChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRevenue} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  {CHART_GRID}
                  <XAxis dataKey="table" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={64} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(Number(v))} />} />
                  <Bar dataKey="table_revenue" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={MAX_BAR_SIZE} {...chartMotion} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </ChartBody>
        </ChartCard>
      </ChartGrid>

      <TableCard
        title={t("tablesInsights.byTable", "Table details")}
        description={sectionName ?? undefined}
        columns={columns}
        data={rows}
        loading={q.isLoading}
        error={failed}
        onRetry={retry}
        emptyTitle={emptyTitle}
        getRowId={(r) => r.key}
        searchPlaceholder={t("tablesInsights.search", "Search tables")}
        hideViewOptions={false}
        toolbar={sections.length > 1 ? (
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-40" aria-label={t("tablesInsights.section", "Section")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("tablesInsights.allSections", "All sections")}</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : undefined}
        onRowClick={(r) => setOpen(r)}
      />

      <Sheet open={!!open} onOpenChange={(v) => { if (!v) setOpen(null); }}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("tablesInsights.historyTitle", "Table {{label}}", { label: open?.table ?? "" })}</SheetTitle>
            <SheetDescription>{open?.section}</SheetDescription>
          </SheetHeader>
          {!branchId ? (
            <p className="p-4 text-sm text-muted-foreground">
              {t("tablesInsights.pickBranch", "Choose a branch in the scope bar to open a table's history.")}
            </p>
          ) : floor.isLoading ? (
            <Skeleton className="m-4 h-32" />
          ) : openTableId ? (
            <TableHistory tableId={openTableId} from={from ?? undefined} to={to ?? undefined} customers={customerSheet} />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              {t("tablesInsights.tableGone", "This table is no longer on the floor plan.")}
            </p>
          )}
        </SheetContent>
      </Sheet>
      {customerSheet.sheet}
    </ReportStack>
  );
}
