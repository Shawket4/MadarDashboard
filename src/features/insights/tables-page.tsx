// Insights ▸ Tables — which tables turn, how long parties stay, and what each
// table and each guest is worth.
//
// Every figure comes from the metrics layer's `tables` dataset: one row per
// settled bill eaten at a table, carrying the sale's own table, covers and the
// moment the party sat down. Branch and period come from the global scope bar;
// the section filter narrows the per-table ledger and its chart in place.
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "motion/react";
import { Armchair, CalendarRange, Clock, Coins, RotateCcw, UserRound, Users } from "lucide-react";

import { Page } from "@/components/app/page";
import { ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { listFloorTables, runMetricsQuery } from "@/data/api/generated/api";
import { useScope } from "@/data/scope/use-scope";
import { fmtMoney, fmtMoneyCompact, fmtNumber } from "@/lib/format";
import { TableHistory } from "@/features/floor/table-history";
import {
  SPECS,
  fmtDwell,
  sectionsOf,
  toHourSeries,
  toSummary,
  toTableRows,
  type TableRow,
} from "./tables-util";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const ALL = "__all__";

export function TablesInsightsPage() {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const { branchId, from, to, preset } = useScope();
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en";
  const [section, setSection] = useState<string>(ALL);
  const [open, setOpen] = useState<TableRow | null>(null);

  const q = useQuery({
    queryKey: ["metrics", "tables", branchId, from, to, locale],
    queryFn: ({ signal }) =>
      runMetricsQuery(
        {
          locale,
          period: from || to ? { from, to } : { preset: "last_30_days" },
          widgets: [
            { key: "summary", spec: SPECS.summary },
            { key: "byTable", spec: SPECS.byTable },
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

  const kpis: LedgerItem[] = [
    { key: "turns", label: t("tablesInsights.turns", "Turns"), icon: RotateCcw, accent: "primary", value: summary?.turns ?? 0, formatType: "number", loading: q.isLoading,
      hint: t("tablesInsights.perDay", "{{value}} per table a day", { value: fmtNumber(summary?.turns_per_day ?? 0, { maximumFractionDigits: 2 }) }) },
    { key: "covers", label: t("tablesInsights.covers", "Covers"), icon: Users, accent: "info", value: summary?.covers ?? 0, formatType: "number", loading: q.isLoading },
    { key: "revenue", label: t("tablesInsights.revenue", "Table revenue"), icon: Coins, accent: "brand", value: summary?.table_revenue ?? 0, formatType: "money", loading: q.isLoading },
    { key: "per_table", label: t("tablesInsights.revenuePerTable", "Revenue per table"), icon: Armchair, accent: "neutral", value: summary?.revenue_per_table ?? 0, formatType: "money", loading: q.isLoading,
      hint: t("tablesInsights.tablesUsed", "{{count}} tables used", { count: summary?.active_tables ?? 0 }) },
    { key: "per_cover", label: t("tablesInsights.revenuePerCover", "Revenue per cover"), icon: UserRound, accent: "success", value: summary?.revenue_per_cover ?? 0, formatType: "money", loading: q.isLoading },
    { key: "dwell", label: t("tablesInsights.avgDwell", "Average stay"), icon: Clock, accent: "warning", value: fmtDwell(summary?.avg_dwell_minutes ?? 0), loading: q.isLoading },
  ];

  const columns = useMemo<ColumnDef<TableRow>[]>(
    () => [
      { accessorKey: "table", header: t("tablesInsights.table", "Table"), cell: ({ row }) => <span className="font-medium">{row.original.table}</span> },
      { accessorKey: "section", header: t("tablesInsights.section", "Section") },
      ...(branchId ? [] : [{ accessorKey: "branch", header: t("tablesInsights.branch", "Branch") } as ColumnDef<TableRow>]),
      { accessorKey: "turns", header: t("tablesInsights.turns", "Turns"), cell: ({ row }) => <span className="tabular">{fmtNumber(row.original.turns)}</span> },
      { accessorKey: "turns_per_day", header: t("tablesInsights.turnsPerDay", "Turns / day"), cell: ({ row }) => <span className="tabular">{fmtNumber(row.original.turns_per_day, { maximumFractionDigits: 2 })}</span> },
      { accessorKey: "covers", header: t("tablesInsights.covers", "Covers"), cell: ({ row }) => <span className="tabular">{fmtNumber(row.original.covers)}</span> },
      { accessorKey: "table_revenue", header: t("tablesInsights.revenue", "Table revenue"), cell: ({ row }) => <span className="font-semibold tabular">{fmtMoney(row.original.table_revenue)}</span> },
      { accessorKey: "revenue_per_cover", header: t("tablesInsights.revenuePerCover", "Revenue per cover"), cell: ({ row }) => <span className="tabular">{fmtMoney(row.original.revenue_per_cover)}</span> },
      { accessorKey: "avg_dwell_minutes", header: t("tablesInsights.avgDwell", "Average stay"), cell: ({ row }) => <span className="tabular">{fmtDwell(row.original.avg_dwell_minutes)}</span> },
    ],
    [t, branchId],
  );

  const failed = q.isError || (q.data && Object.values(q.data.results).some((r) => r.status === "error"));
  const empty = <EmptyState title={t("tablesInsights.empty", "No table sales in this period")} />;

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {t("tablesInsights.title", "Tables")}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarRange className="size-3.5" />
            {t(`scope.preset.${preset ?? "30d"}`, preset ?? "30d")}
          </p>
        </div>
        {sections.length > 1 ? (
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="h-9 w-auto min-w-40" aria-label={t("tablesInsights.section", "Section")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("tablesInsights.allSections", "All sections")}</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {failed ? <EmptyState title={t("common.somethingWrong", "Something went wrong")} /> : null}

      <LedgerStrip items={kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("tablesInsights.busiestHours", "Busiest hours")} description={t("tablesInsights.busiestHoursHint", "Parties settled at tables, by hour")}>
          {q.isLoading ? <Skeleton className="h-72 w-full" /> : hours.length === 0 ? empty : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hours} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="hour" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v, n) => `${n === "covers" ? t("tablesInsights.covers", "Covers") : t("tablesInsights.turns", "Turns")}: ${fmtNumber(Number(v))}`} />} />
                  <Bar dataKey="turns" fill={chartColor(0)} radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title={t("tablesInsights.topRevenue", "Revenue by table")}>
          {q.isLoading ? <Skeleton className="h-72 w-full" /> : topRevenue.length === 0 ? empty : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRevenue} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="table" tick={AXIS} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(Number(v))} width={48} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={(v) => fmtMoney(Number(v))} />} />
                  <Bar dataKey="table_revenue" fill={chartColor(1)} radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={q.isLoading}
        getRowId={(r) => r.key}
        emptyState={empty}
        searchPlaceholder={t("tablesInsights.search", "Search tables")}
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
            <TableHistory tableId={openTableId} from={from ?? undefined} to={to ?? undefined} />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              {t("tablesInsights.tableGone", "This table is no longer on the floor plan.")}
            </p>
          )}
        </SheetContent>
      </Sheet>
    </Page>
  );
}
