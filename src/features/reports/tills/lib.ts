import { TZDate } from "@date-fns/tz";

import { getActiveTz } from "@/lib/format";
import type { TillSessionRow } from "@/data/api/generated/models";

/** Minutes past local midnight, in the active timezone. */
export const minutesOfDay = (iso: string): number => {
  const d = new TZDate(iso, getActiveTz());
  return d.getHours() * 60 + d.getMinutes();
};

/** Local hour (0–23) in the active timezone. */
export const hourOf = (iso: string): number => new TZDate(iso, getActiveTz()).getHours();

/**
 * The average time of day of a set of clock times.
 *
 * A plain mean is WRONG across midnight: tills opened at 23:50 and 00:10
 * average to 12:00 — the middle of the following day, and the one time
 * neither till was opened. Clock times are angles on a circle, so this takes
 * the circular mean (average the unit vectors, then take the bearing).
 *
 * Returns minutes past midnight, or null when there is nothing to average or
 * the times cancel out exactly (opens spread evenly round the clock have no
 * meaningful "average" — saying 00:00 would be a fiction).
 */
export const meanTimeOfDay = (minutes: number[]): number | null => {
  if (minutes.length === 0) return null;
  let x = 0;
  let y = 0;
  for (const m of minutes) {
    const angle = (m / 1440) * 2 * Math.PI;
    x += Math.cos(angle);
    y += Math.sin(angle);
  }
  // Vectors cancelling means the times are spread round the clock: no centre.
  if (Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9) return null;
  const mean = Math.atan2(y / minutes.length, x / minutes.length);
  const mins = Math.round((mean / (2 * Math.PI)) * 1440);
  return ((mins % 1440) + 1440) % 1440;
};

/** "07:05" from minutes past midnight. */
export const fmtMinutesOfDay = (mins: number | null): string =>
  mins == null
    ? "—"
    : `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

export interface SalesStats {
  tills: number;
  orders: number;
  sales: number;
  /** Average bill across every sale in the period. */
  avgOrderValue: number;
  /** Average takings per till session. */
  avgSalesPerTill: number;
  /** The single busiest session by sales, for the "who carried the day" line. */
  best: TillSessionRow | null;
}

export const salesStats = (rows: TillSessionRow[]): SalesStats => {
  const orders = rows.reduce((n, r) => n + r.orders_count, 0);
  const sales = rows.reduce((n, r) => n + r.gross_sales, 0);
  let best: TillSessionRow | null = null;
  for (const r of rows) if (!best || r.gross_sales > best.gross_sales) best = r;
  return {
    tills: rows.length,
    orders,
    sales,
    avgOrderValue: orders > 0 ? Math.round(sales / orders) : 0,
    avgSalesPerTill: rows.length > 0 ? Math.round(sales / rows.length) : 0,
    best,
  };
};

export interface TimingStats {
  /** Minutes past midnight, circular-averaged. */
  avgOpen: number | null;
  avgClose: number | null;
  /** Milliseconds. Only CLOSED sessions can have a length. */
  avgDurationMs: number | null;
  longest: TillSessionRow | null;
  shortest: TillSessionRow | null;
  /** Sessions still running — they have no close time to average. */
  openNow: number;
}

export const durationMs = (r: TillSessionRow): number | null =>
  r.closed_at ? new Date(r.closed_at).getTime() - new Date(r.opened_at).getTime() : null;

export const timingStats = (rows: TillSessionRow[]): TimingStats => {
  const closed = rows.filter((r) => r.closed_at);
  const durations = closed
    .map((r) => ({ r, ms: durationMs(r)! }))
    // A clock skew or a bad close can land a negative span; it would drag the
    // average somewhere impossible, so it is not an average of anything.
    .filter((d) => d.ms >= 0);

  let longest: TillSessionRow | null = null;
  let shortest: TillSessionRow | null = null;
  for (const d of durations) {
    if (!longest || d.ms > durationMs(longest)!) longest = d.r;
    if (!shortest || d.ms < durationMs(shortest)!) shortest = d.r;
  }

  return {
    avgOpen: meanTimeOfDay(rows.map((r) => minutesOfDay(r.opened_at))),
    avgClose: meanTimeOfDay(closed.map((r) => minutesOfDay(r.closed_at!))),
    avgDurationMs:
      durations.length > 0
        ? Math.round(durations.reduce((n, d) => n + d.ms, 0) / durations.length)
        : null,
    longest,
    shortest,
    openNow: rows.length - closed.length,
  };
};

/** Opens and closes bucketed by local hour, for the 24-hour chart. */
export const byHour = (rows: TillSessionRow[]): { hour: number; opened: number; closed: number }[] => {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, opened: 0, closed: 0 }));
  for (const r of rows) {
    buckets[hourOf(r.opened_at)].opened += 1;
    if (r.closed_at) buckets[hourOf(r.closed_at)].closed += 1;
  }
  return buckets;
};
