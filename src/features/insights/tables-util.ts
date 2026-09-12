// Table analytics vocabulary: the specs the Tables page asks the metrics layer
// for, and the pure shaping of what comes back.
import type { QuerySpec, WidgetOutcome } from "@/data/api/generated/models";

export const TABLE_MEASURES = [
  "turns",
  "turns_per_day",
  "covers",
  "table_revenue",
  "revenue_per_cover",
  "avg_dwell_minutes",
] as const;

export interface TableRow {
  key: string;
  branch: string;
  section: string;
  table: string;
  turns: number;
  turns_per_day: number;
  covers: number;
  table_revenue: number;
  revenue_per_cover: number;
  avg_dwell_minutes: number;
}

export interface TableSummary {
  turns: number;
  turns_per_day: number;
  covers: number;
  table_revenue: number;
  revenue_per_cover: number;
  avg_dwell_minutes: number;
  active_tables: number;
  revenue_per_table: number;
}

export const SPECS = {
  summary: {
    dataset: "tables",
    measures: [...TABLE_MEASURES, "active_tables", "revenue_per_table"],
  },
  byTable: {
    dataset: "tables",
    dimensions: ["branch", "section", "table"],
    measures: [...TABLE_MEASURES],
    sort: { measure: "turns", dir: "desc" },
    limit: 500,
  },
  byHour: {
    dataset: "tables",
    dimensions: ["hour"],
    measures: ["turns", "covers"],
    limit: 24,
  },
} satisfies Record<string, QuerySpec>;

type Row = Record<string, unknown>;

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The rows of a widget that succeeded; an empty list for one that failed. */
export function rowsOf(outcome: WidgetOutcome | undefined): Row[] {
  if (!outcome || outcome.status !== "ok") return [];
  return outcome.rows as Row[];
}

export function toSummary(outcome: WidgetOutcome | undefined): TableSummary | null {
  const r = rowsOf(outcome)[0];
  if (!r) return null;
  return {
    turns: num(r.turns),
    turns_per_day: num(r.turns_per_day),
    covers: num(r.covers),
    table_revenue: num(r.table_revenue),
    revenue_per_cover: num(r.revenue_per_cover),
    avg_dwell_minutes: num(r.avg_dwell_minutes),
    active_tables: num(r.active_tables),
    revenue_per_table: num(r.revenue_per_table),
  };
}

export function toTableRows(outcome: WidgetOutcome | undefined): TableRow[] {
  return rowsOf(outcome).map((r) => ({
    key: [str(r.branch), str(r.section), str(r.table)].join("|"),
    branch: str(r.branch),
    section: str(r.section),
    table: str(r.table),
    turns: num(r.turns),
    turns_per_day: num(r.turns_per_day),
    covers: num(r.covers),
    table_revenue: num(r.table_revenue),
    revenue_per_cover: num(r.revenue_per_cover),
    avg_dwell_minutes: num(r.avg_dwell_minutes),
  }));
}

/** Hours of the day in order ("HH:00"), gaps filled so the axis is honest. */
export function toHourSeries(
  outcome: WidgetOutcome | undefined,
): { hour: string; turns: number; covers: number }[] {
  const byHour = new Map(rowsOf(outcome).map((r) => [str(r.hour), r]));
  const hours = [...byHour.keys()].filter(Boolean).sort();
  if (hours.length === 0) return [];
  const first = Number(hours[0].slice(0, 2));
  const last = Number(hours[hours.length - 1].slice(0, 2));
  const out: { hour: string; turns: number; covers: number }[] = [];
  for (let h = first; h <= last; h++) {
    const key = `${String(h).padStart(2, "0")}:00`;
    const r = byHour.get(key);
    out.push({ hour: key, turns: num(r?.turns), covers: num(r?.covers) });
  }
  return out;
}

/** Distinct sections, sorted, for the section filter. */
export function sectionsOf(rows: TableRow[]): string[] {
  return [...new Set(rows.map((r) => r.section))].sort((a, b) => a.localeCompare(b));
}

/** "1h 05m" from fractional minutes. */
export function fmtDwell(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 1) return "—";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${String(r).padStart(2, "0")}m`;
}
