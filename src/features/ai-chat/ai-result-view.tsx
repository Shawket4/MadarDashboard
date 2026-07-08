import { useTranslation } from "react-i18next";
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

/** The renderable pieces derived from the response's typed columns. */
function useShape(res: AiChatResponse) {
  const dimension = res.columns.find(isDimension);
  const measures = res.columns.filter(isMeasure);
  const primary = measures[0];
  return { dimension, measures, primary };
}

export function AiResultView({ res }: { res: AiChatResponse }) {
  const { t } = useTranslation();
  const { dimension, primary } = useShape(res);
  const rows = res.rows as Row[];

  const showChart =
    res.chart !== "table" && !!dimension && !!primary && rows.length > 0;

  return (
    <div className="space-y-4">
      {showChart && dimension && primary ? (
        <ChartCard title={res.title}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(res.chart, rows, dimension, primary)}
            </ResponsiveContainer>
          </div>
        </ChartCard>
      ) : null}

      {/* Always show the full data as a table — the source of truth. */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {res.columns.map((c) => (
                <TableHead key={c.key} className={isMeasure(c) ? "text-end" : undefined}>
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={res.columns.length} className="text-center text-muted-foreground">
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
    </div>
  );
}

function renderChart(chart: string, rows: Row[], dimension: Column, primary: Column) {
  const fmt = measureFormatter(primary);
  const axisTick = { fontSize: 11 };

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
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
        />
      </LineChart>
    );
  }

  // bar (default)
  return (
    <BarChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey={dimension.key} tickLine={false} axisLine={false} tick={axisTick} />
      <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} tickFormatter={fmt} />
      <Tooltip formatter={(v) => fmt(Number(v))} />
      <Bar dataKey={primary.key} name={primary.label} fill={chartColor(0)} radius={[4, 4, 0, 0]} />
    </BarChart>
  );
}
