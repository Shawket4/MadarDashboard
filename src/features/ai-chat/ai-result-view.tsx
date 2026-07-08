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
  const dimension = res.columns.find(isDimension);
  const primary = res.columns.find(isMeasure);
  const rows = res.rows as Row[];

  const showChart = res.chart !== "table" && !!dimension && !!primary && rows.length > 0;

  // Build the scope label frontend-side so it localizes (the API label is English).
  const scope = res.scope;
  const scopeLabel = scope.all_branches
    ? scope.branches.length > 1
      ? t("aiChat.scopeAllN", "All branches ({{count}})", { count: scope.branches.length })
      : (scope.branches[0] ?? t("aiChat.scopeAll", "All branches"))
    : scope.branches.join(", ");

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

      {showChart && dimension && primary ? (
        <ChartCard>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(res.chart, rows, dimension, primary, reduce ?? false)}
            </ResponsiveContainer>
          </div>
        </ChartCard>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {res.columns.map((c) => (
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
                <TableCell
                  colSpan={res.columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("aiChat.noData", "No data for this question.")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  {res.columns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={isMeasure(c) ? "text-end tabular-nums" : undefined}
                    >
                      {formatCell(c, row[c.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {res.truncated ? (
        <p className="text-xs text-muted-foreground">
          {t("aiChat.truncated", "Showing the first {{count}} rows.", { count: res.row_count })}
        </p>
      ) : null}
    </motion.div>
  );
}

function renderChart(
  chart: string,
  rows: Row[],
  dimension: Column,
  primary: Column,
  reduce: boolean,
) {
  const fmt = measureFormatter(primary);
  const axisTick = { fontSize: 11 };
  const anim = !reduce;

  if (chart === "pie") {
    return (
      <PieChart>
        <Pie
          data={rows}
          dataKey={primary.key}
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
        <Tooltip formatter={(v) => fmt(Number(v))} />
        <Legend />
      </PieChart>
    );
  }

  if (chart === "line") {
    return (
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={dimension.key} tickLine={false} axisLine={false} tick={axisTick} />
        <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} tickFormatter={fmt} />
        <Tooltip formatter={(v) => fmt(Number(v))} />
        <Line
          type="monotone"
          dataKey={primary.key}
          name={primary.label}
          stroke={chartColor(0)}
          strokeWidth={2}
          dot={false}
          isAnimationActive={anim}
        />
      </LineChart>
    );
  }

  return (
    <BarChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
      <XAxis dataKey={dimension.key} tickLine={false} axisLine={false} tick={axisTick} />
      <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} tickFormatter={fmt} />
      <Tooltip formatter={(v) => fmt(Number(v))} />
      <Bar
        dataKey={primary.key}
        name={primary.label}
        fill={chartColor(0)}
        radius={[4, 4, 0, 0]}
        isAnimationActive={anim}
      />
    </BarChart>
  );
}
