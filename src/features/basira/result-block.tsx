/**
 * Renders any `ResultBlock`, whatever shape it is.
 *
 * The point of the analytics core is that a result describes itself: `grain`
 * says what shape it is, `viz` says how it was decided it should be drawn, and
 * every column carries a `kind` that says how to format it. So this file has no
 * per-metric knowledge and never needs any — a new preset on the backend
 * renders here the day it ships, with no change on this side.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtMoneyCompact, fmtNumber } from "@/lib/format";
import type { Column, ColumnKind, ResultBlock } from "./types";

/** The chart palette, in the order series are assigned. */
const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

/**
 * Format one cell by its declared kind.
 *
 * `null` renders as an em dash, never as zero. The backend returns null for a
 * cost or margin it genuinely does not know — a missing cost snapshot — and
 * showing 0 there would read as "this item costs nothing", which is a different
 * and much worse claim than "we do not know".
 */
export function formatCell(value: unknown, kind: ColumnKind, compact = false): string {
  if (value === null || value === undefined) return "—";
  switch (kind) {
    case "money":
      return compact ? fmtMoneyCompact(Number(value)) : fmtMoney(Number(value));
    case "count":
      return fmtNumber(Number(value));
    case "number":
      return `${fmtNumber(Number(value), { maximumFractionDigits: 1 })}`;
    case "minutes": {
      const mins = Number(value);
      if (mins < 60) return `${fmtNumber(Math.round(mins))}m`;
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
    case "date":
    case "label":
    default:
      return String(value);
  }
}

const dimensionsOf = (columns: Column[]) => columns.filter((c) => !isNumeric(c.kind));
const measuresOf = (columns: Column[]) => columns.filter((c) => isNumeric(c.kind));

function isNumeric(kind: ColumnKind): boolean {
  return kind === "money" || kind === "count" || kind === "number" || kind === "minutes";
}

/** Money arrives as integer piastres; charts plot pounds so the axis reads right. */
const plotValue = (raw: unknown, kind: ColumnKind): number | null => {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return kind === "money" ? n / 100 : n;
};

function ChartTip({
  active,
  payload,
  label,
  measures,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number; color?: string }[];
  label?: string | number;
  measures: Column[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-foreground">{String(label ?? "")}</p>
      {payload.map((p) => {
        const col = measures.find((m) => m.key === p.dataKey);
        if (!col) return null;
        // Undo the pounds conversion so the tooltip shows a properly formatted
        // amount rather than a bare number.
        const raw = col.kind === "money" ? Number(p.value) * 100 : Number(p.value);
        return (
          <p key={String(p.dataKey)} className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{col.label}</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatCell(raw, col.kind)}
            </span>
          </p>
        );
      })}
    </div>
  );
}

export function ResultView({ block, className }: { block: ResultBlock; className?: string }) {
  const { t } = useTranslation();
  const dims = useMemo(() => dimensionsOf(block.columns), [block.columns]);
  const measures = useMemo(() => measuresOf(block.columns), [block.columns]);

  // An empty result is NOT a zero. The backend distinguishes them and so must
  // the UI — "no orders were voided" and "voided orders totalled 0" are
  // different findings, and conflating them is how a dashboard lies quietly.
  if (block.row_count === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border/70 px-4 py-6 text-center",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">
          {t("basira.noActivity", "No activity in this period")}
        </p>
      </div>
    );
  }

  const chartData = block.rows.map((row) => {
    const point: Record<string, string | number | null> = {};
    for (const c of block.columns) {
      point[c.key] = isNumeric(c.kind) ? plotValue(row[c.key], c.kind) : String(row[c.key] ?? "—");
    }
    return point;
  });

  const axisKey = dims[0]?.key;

  const body = (() => {
    switch (block.viz) {
      case "kpi":
        return <KpiView block={block} measures={measures} />;
      case "line":
      case "area":
        return (
          <ChartFrame>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                {measures.map((m, i) => (
                  <linearGradient key={m.key} id={`g-${block.spec.dataset}-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES[i % SERIES.length]} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={SERIES[i % SERIES.length]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={axisKey} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={52} />
              <Tooltip content={<ChartTip measures={measures} />} />
              {measures.map((m, i) => (
                <Area
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={SERIES[i % SERIES.length]}
                  strokeWidth={2}
                  fill={`url(#g-${block.spec.dataset}-${m.key})`}
                  // A gap is a day with no data; joining across it would draw a
                  // trend line through a hole that never existed.
                  connectNulls={false}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ChartFrame>
        );
      case "bar":
      case "row":
        return (
          <ChartFrame>
            <BarChart
              data={chartData}
              layout={block.viz === "row" ? "vertical" : "horizontal"}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={block.viz === "row"} horizontal={block.viz !== "row"} />
              {block.viz === "row" ? (
                <>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey={axisKey} width={120} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                </>
              ) : (
                <>
                  <XAxis dataKey={axisKey} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={0} angle={chartData.length > 6 ? -25 : 0} textAnchor={chartData.length > 6 ? "end" : "middle"} height={chartData.length > 6 ? 56 : 30} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={52} />
                </>
              )}
              <Tooltip content={<ChartTip measures={measures} />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              {measures.slice(0, 2).map((m, i) => (
                <Bar key={m.key} dataKey={m.key} name={m.label} fill={SERIES[i % SERIES.length]} radius={block.viz === "row" ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ChartFrame>
        );
      case "pie":
      case "donut": {
        const m = measures[0];
        if (!m) return <TableView block={block} />;
        return (
          <ChartFrame>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={m.key}
                nameKey={axisKey}
                innerRadius={block.viz === "donut" ? "55%" : 0}
                outerRadius="80%"
                paddingAngle={1}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={SERIES[i % SERIES.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip measures={measures} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ChartFrame>
        );
      }
      case "heatmap":
        return <HeatmapView block={block} />;
      case "table":
      default:
        return <TableView block={block} />;
    }
  })();

  return (
    <div className={cn("space-y-2", className)}>
      {body}
      {block.truncated ? (
        <p className="text-[11px] text-muted-foreground">
          {t("basira.truncated", "Showing the first {{count}} rows.", {
            count: block.rows.length,
          })}
        </p>
      ) : null}
    </div>
  );
}

/** Recharts needs an explicit height; a percentage inside an auto-height parent collapses. */
function ChartFrame({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function KpiView({ block, measures }: { block: ResultBlock; measures: Column[] }) {
  const row = block.rows[0] ?? {};
  return (
    <div className="flex flex-wrap gap-6">
      {measures.map((m) => (
        <div key={m.key}>
          <p className="text-xs text-muted-foreground">{m.label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
            {formatCell(row[m.key], m.kind)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TableView({ block }: { block: ResultBlock }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border/70">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            {block.columns.map((c) => (
              <TableHead key={c.key} className={cn(isNumeric(c.kind) && "text-end")}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.rows.map((row, i) => (
            <TableRow key={i}>
              {block.columns.map((c) => (
                <TableCell
                  key={c.key}
                  className={cn(isNumeric(c.kind) && "text-end tabular-nums")}
                >
                  {formatCell(row[c.key], c.kind)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Two dimensions as an intensity grid — weekday × hour is the one that matters.
 * Falls back to a table when the shape is not actually two-dimensional, rather
 * than rendering an empty grid.
 */
function HeatmapView({ block }: { block: ResultBlock }) {
  const dims = dimensionsOf(block.columns);
  const measure = measuresOf(block.columns)[0];
  if (dims.length < 2 || !measure) return <TableView block={block} />;

  const [rowDim, colDim] = dims;
  const rowKeys = [...new Set(block.rows.map((r) => String(r[rowDim.key] ?? "")))];
  const colKeys = [...new Set(block.rows.map((r) => String(r[colDim.key] ?? "")))].sort();
  const lookup = new Map(
    block.rows.map((r) => [`${r[rowDim.key]}|${r[colDim.key]}`, Number(r[measure.key] ?? 0)]),
  );
  const max = Math.max(...[...lookup.values()], 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 text-[10px]">
        <thead>
          <tr>
            <th />
            {colKeys.map((c) => (
              <th key={c} className="px-0.5 pb-1 font-normal text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((r) => (
            <tr key={r}>
              <td className="pe-2 text-end text-muted-foreground whitespace-nowrap">{r}</td>
              {colKeys.map((c) => {
                const v = lookup.get(`${r}|${c}`) ?? 0;
                return (
                  <td key={c} title={`${r} · ${c} · ${formatCell(v, measure.kind)}`}>
                    <div
                      className="h-6 min-w-6 rounded-sm"
                      style={{
                        // Opacity carries the value; a hue ramp would imply
                        // categories that are not there.
                        background: "var(--chart-1)",
                        opacity: v === 0 ? 0.06 : 0.15 + (v / max) * 0.85,
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The scope an answer covers, when it is worth saying. */
export function ScopeBadge({ block }: { block: ResultBlock }) {
  const { t } = useTranslation();
  if (!block.scope.unmatched_branch && block.scope.all_branches) return null;
  return (
    <Badge variant="outline" className="text-[10px] font-normal">
      {block.scope.unmatched_branch
        ? t("basira.unmatchedBranch", "No branch matched “{{name}}” — showing all branches", {
            name: block.scope.unmatched_branch,
          })
        : block.scope.label}
    </Badge>
  );
}
