import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, BadgeCheck, Building2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard, chartColor } from "@/components/app/chart-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDate, fmtMoney, fmtMoneyCompact, fmtNumber, fmtNumberCompact } from "@/lib/format";
import type { AiChatResponse, Column } from "@/data/api/generated/models";

type Row = Record<string, string | number | null>;

const isMeasure = (c: Column) => c.kind === "money" || c.kind === "count" || c.kind === "number";
const isDimension = (c: Column) => c.kind === "label" || c.kind === "date";

/** Format a cell value for the table according to its column kind. */
function formatCell(col: Column, value: unknown): string {
  if (value === null || value === undefined) return "—";
  switch (col.kind) {
    case "money":
      return fmtMoney(Number(value));
    case "count":
      return fmtNumber(Number(value));
    case "number": {
      const n = fmtNumber(Number(value), { maximumFractionDigits: 1 });
      return col.key.includes("pct") ? `${n}%` : n;
    }
    case "date":
      return fmtDate(String(value));
    default:
      return String(value);
  }
}

/** Compact axis/tooltip formatter for a measure column. */
function measureFormatter(col: Column) {
  if (col.kind === "money") return (v: number) => fmtMoneyCompact(v);
  return (v: number) => fmtNumberCompact(v);
}

export function AiResultView({ res }: { res: AiChatResponse }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const rows = res.rows as Row[];
  const facetKey = res.facet_by ?? null;

  // Build the scope label frontend-side so it localizes (the API label is English).
  const scope = res.scope;
  const scopeLabel = scope.all_branches
    ? scope.branches.length > 1
      ? t("aiChat.scopeAllN", "All branches ({{count}})", { count: scope.branches.length })
      : (scope.branches[0] ?? t("aiChat.scopeAll", "All branches"))
    : scope.branches.join(", ");

  // Columns rendered inside each section — when faceting, the facet column is
  // the section heading, so drop it from the per-section table/chart.
  const sectionColumns = facetKey ? res.columns.filter((c) => c.key !== facetKey) : res.columns;

  // Group rows by the facet column, preserving first-seen order.
  const groups = useMemo(() => {
    if (!facetKey) return null;
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      const k = String(row[facetKey] ?? "—");
      const arr = map.get(k) ?? [];
      arr.push(row);
      map.set(k, arr);
    }
    return Array.from(map, ([key, groupRows]) => ({ key, rows: groupRows }));
  }, [facetKey, rows]);

  return (
    <motion.div
      className="space-y-3"
      initial={reduce ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Trust + scope: the answer came from a named, verified report — and this
          states exactly which branches it covers, never ambiguously. */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium text-muted-foreground">
        <BadgeCheck className="size-3.5 text-emerald-500" aria-hidden="true" />
        <span>{t("aiChat.verified", "Verified report")}</span>
        <span className="text-muted-foreground/50">·</span>
        <span>{res.title}</span>
        <span
          className="ms-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
          title={t("aiChat.scopeTitle", "Branches covered by this answer")}
        >
          <Building2 className="size-3" aria-hidden="true" />
          {scopeLabel}
        </span>
      </div>

      {scope.unmatched_branch ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          {t("aiChat.scopeUnmatched", "Couldn't find a branch called “{{name}}” — showing all branches.", {
            name: scope.unmatched_branch,
          })}
        </div>
      ) : null}

      {groups ? (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{g.key}</h3>
              <ResultSection
                columns={sectionColumns}
                rows={g.rows}
                chart={res.chart}
                reduce={reduce ?? false}
              />
            </section>
          ))}
        </div>
      ) : (
        <ResultSection
          columns={sectionColumns}
          rows={rows}
          chart={res.chart}
          reduce={reduce ?? false}
        />
      )}

      {res.truncated ? (
        <p className="text-xs text-muted-foreground">
          {t("aiChat.truncated", "Showing the first {{count}} rows.", { count: res.row_count })}
        </p>
      ) : null}
    </motion.div>
  );
}

/** One result block: an optional chart (all measures as series) plus the table. */
function ResultSection({
  columns,
  rows,
  chart,
  reduce,
}: {
  columns: Column[];
  rows: Row[];
  chart: string;
  reduce: boolean;
}) {
  const { t } = useTranslation();
  const dimension = columns.find(isDimension);
  const measures = columns.filter(isMeasure);
  const showChart = chart !== "table" && !!dimension && measures.length > 0 && rows.length > 0;

  return (
    <>
      {showChart && dimension ? (
        <ChartCard>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(chart, rows, dimension, measures, reduce)}
            </ResponsiveContainer>
          </div>
        </ChartCard>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={isMeasure(c) ? "text-end whitespace-nowrap" : "whitespace-nowrap"}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                  {t("aiChat.noData", "No data for this question.")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={isMeasure(c) ? "text-end tabular-nums" : undefined}>
                      {formatCell(c, row[c.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** Tooltip/axis value formatter that respects each series' own column kind. */
function seriesFormatter(measures: Column[]) {
  return (value: number, name?: string) => {
    const col = measures.find((m) => m.label === name) ?? measures[0];
    return [measureFormatter(col)(Number(value)), name] as [string, string | undefined];
  };
}

function renderChart(chart: string, rows: Row[], dimension: Column, measures: Column[], reduce: boolean) {
  const anim = !reduce;
  const axisTick = { fontSize: 11 };
  // Axis uses the first measure's formatter (mixed-unit axes share one scale).
  const axisFmt = measureFormatter(measures[0]);
  const tipFmt = seriesFormatter(measures);
  const multi = measures.length > 1;

  if (chart === "pie") {
    const m = measures[0];
    return (
      <PieChart>
        <Pie
          data={rows}
          dataKey={m.key}
          nameKey={dimension.key}
          cx="50%"
          cy="50%"
          outerRadius="80%"
          isAnimationActive={anim}
          label={(e: { name?: string }) => e.name ?? ""}
        >
          {rows.map((_, i) => (
            <Cell key={i} fill={chartColor(i)} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => measureFormatter(m)(Number(v))} />
        <Legend />
      </PieChart>
    );
  }

  if (chart === "line") {
    return (
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={dimension.key} tickLine={false} axisLine={false} tick={axisTick} />
        <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} tickFormatter={axisFmt} />
        <Tooltip formatter={tipFmt} />
        {multi ? <Legend /> : null}
        {measures.map((m, i) => (
          <Line
            key={m.key}
            type="monotone"
            dataKey={m.key}
            name={m.label}
            stroke={chartColor(i)}
            strokeWidth={2}
            dot={false}
            isAnimationActive={anim}
          />
        ))}
      </LineChart>
    );
  }

  return (
    <BarChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
      <XAxis dataKey={dimension.key} tickLine={false} axisLine={false} tick={axisTick} />
      <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} tickFormatter={axisFmt} />
      <Tooltip formatter={tipFmt} />
      {multi ? <Legend /> : null}
      {measures.map((m, i) => (
        <Bar
          key={m.key}
          dataKey={m.key}
          name={m.label}
          fill={chartColor(i)}
          radius={[4, 4, 0, 0]}
          isAnimationActive={anim}
        />
      ))}
    </BarChart>
  );
}
