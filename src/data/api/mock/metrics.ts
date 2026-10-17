import { http, HttpResponse } from "msw";

/**
 * POST /metrics/query in mock mode: the `tables` dataset only (Reports ▸
 * Operations ▸ Tables). Seeded per table; summary, by-table and by-hour widgets
 * are all derived from the same rows, so the page's figures agree with each
 * other. Money is in piastres, as the API sends it.
 */
const DAYS = 30;
const TABLES = [
  { branch: "Zamalek", section: "Main hall", table: "T1", turns: 96, covers: 214, table_revenue: 984_000, dwell: 48 },
  { branch: "Zamalek", section: "Main hall", table: "T2", turns: 88, covers: 190, table_revenue: 876_000, dwell: 52 },
  { branch: "Zamalek", section: "Main hall", table: "T3", turns: 71, covers: 236, table_revenue: 1_132_000, dwell: 67 },
  { branch: "Zamalek", section: "Main hall", table: "T4", turns: 64, covers: 128, table_revenue: 541_000, dwell: 41 },
  { branch: "Zamalek", section: "Terrace", table: "P1", turns: 58, covers: 174, table_revenue: 793_000, dwell: 74 },
  { branch: "Zamalek", section: "Terrace", table: "P2", turns: 49, covers: 98, table_revenue: 412_000, dwell: 63 },
  { branch: "Zamalek", section: "Terrace", table: "P3", turns: 37, covers: 111, table_revenue: 526_000, dwell: 88 },
  { branch: "Zamalek", section: "Bar", table: "B1", turns: 112, covers: 131, table_revenue: 489_000, dwell: 29 },
  { branch: "Zamalek", section: "Bar", table: "B2", turns: 104, covers: 118, table_revenue: 437_000, dwell: 31 },
];
const HOURS: [string, number][] = [
  ["08:00", 0.04], ["09:00", 0.07], ["10:00", 0.06], ["11:00", 0.05], ["12:00", 0.08], ["13:00", 0.11],
  ["14:00", 0.10], ["15:00", 0.06], ["16:00", 0.05], ["17:00", 0.06], ["18:00", 0.08], ["19:00", 0.1],
  ["20:00", 0.09], ["21:00", 0.05],
];

type Row = Record<string, string | number>;

function tableRow(t: (typeof TABLES)[number]): Row {
  return {
    branch: t.branch,
    section: t.section,
    table: t.table,
    turns: t.turns,
    turns_per_day: t.turns / DAYS,
    covers: t.covers,
    table_revenue: t.table_revenue,
    revenue_per_cover: t.table_revenue / t.covers,
    avg_dwell_minutes: t.dwell,
  };
}

function summary(): Row {
  const sum = (k: "turns" | "covers" | "table_revenue") => TABLES.reduce((a, t) => a + t[k], 0);
  const turns = sum("turns");
  return {
    turns,
    turns_per_day: turns / DAYS / TABLES.length,
    covers: sum("covers"),
    table_revenue: sum("table_revenue"),
    revenue_per_cover: sum("table_revenue") / sum("covers"),
    avg_dwell_minutes: TABLES.reduce((a, t) => a + t.dwell * t.turns, 0) / turns,
    active_tables: TABLES.length,
    revenue_per_table: sum("table_revenue") / TABLES.length,
  };
}

function rowsFor(spec: { dataset?: string; dimensions?: string[] }): Row[] {
  const dims = spec.dimensions ?? [];
  if (dims.includes("hour")) {
    const turns = TABLES.reduce((a, t) => a + t.turns, 0);
    const covers = TABLES.reduce((a, t) => a + t.covers, 0);
    return HOURS.map(([hour, share]) => ({ hour, turns: Math.round(turns * share), covers: Math.round(covers * share) }));
  }
  if (dims.includes("table")) return TABLES.map(tableRow);
  return [summary()];
}

export const metricsHandlers = [
  http.post("*/metrics/query", async ({ request }) => {
    const body = (await request.json()) as { widgets?: { key: string; spec: { dataset?: string; dimensions?: string[] } }[] };
    const results: Record<string, unknown> = {};
    for (const w of body.widgets ?? []) {
      if (w.spec.dataset !== "tables") {
        results[w.key] = { status: "error", error: "Not in mock mode" };
        continue;
      }
      const rows = rowsFor(w.spec);
      results[w.key] = {
        status: "ok",
        columns: [],
        grain: "none",
        period: { from: "", to: "", label: "" },
        row_count: rows.length,
        rows,
        truncated: false,
        viz: "table",
      };
    }
    return HttpResponse.json({
      results,
      scope: { all_branches: true, branches: [], label: "All branches" },
      timezone: "Africa/Cairo",
    });
  }),
];
