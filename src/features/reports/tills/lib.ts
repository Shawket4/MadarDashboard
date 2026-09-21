import { TZDate } from "@date-fns/tz";
import { AxiosError } from "axios";

import { fmtDate, fmtWireTime, getActiveTz } from "@/lib/format";
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

/**
 * Minutes past midnight as the clock the rest of the app shows: 12-hour, in the
 * app language (`07:05 AM`, `07:05 ص`) — the same shape as the table's
 * opened-at column, not a second, 24-hour dialect on the same page.
 */
export const fmtMinutesOfDay = (mins: number | null): string =>
  mins == null
    ? "—"
    : fmtWireTime(`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);

/**
 * A `YYYY-MM-DD` business date, as a date.
 *
 * It is a calendar day, not an instant. `new Date("2026-09-18")` is midnight
 * UTC, which a formatter in any zone west of Greenwich renders as the 17th —
 * so the day is pinned to local noon in the active zone before formatting.
 */
export const fmtBusinessDate = (ymd: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return "—";
  return fmtDate(new TZDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, getActiveTz()));
};

/** The session's drawer is still running. `status` is the API's word for it. */
export const isOpen = (r: TillSessionRow): boolean => r.status === "open";
/** Closed by a manager without the teller's count — the figures are not a reconciliation. */
export const isForceClosed = (r: TillSessionRow): boolean => r.status === "force_closed";

/**
 * The API refuses a range it will not list whole (400: more than 5000 sessions,
 * or `to` before `from`). Retrying cannot help; only a shorter period can.
 */
export const isRangeRefused = (err: unknown): boolean =>
  err instanceof AxiosError && err.response?.status === 400;

export interface SalesStats {
  tills: number;
  orders: number;
  /** Net of refunds — the API's `net_sales`; voided and fully refunded bills are not in it. */
  sales: number;
  /** Average bill across every sale in the period. */
  avgOrderValue: number;
  /** Average takings per till session. */
  avgSalesPerTill: number;
}

export const salesStats = (rows: TillSessionRow[]): SalesStats => {
  const orders = rows.reduce((n, r) => n + r.orders_count, 0);
  const sales = rows.reduce((n, r) => n + r.net_sales, 0);
  return {
    tills: rows.length,
    orders,
    sales,
    avgOrderValue: orders > 0 ? Math.round(sales / orders) : 0,
    avgSalesPerTill: rows.length > 0 ? Math.round(sales / rows.length) : 0,
  };
};

export interface TimingStats {
  /** Minutes past midnight, circular-averaged. */
  avgOpen: number | null;
  avgClose: number | null;
  /** Milliseconds. Only CLOSED sessions can have a length. */
  avgDurationMs: number | null;
  longest: TillSessionRow | null;
  /** Sessions still running — they have no close time to average. */
  openNow: number;
}

export const durationMs = (r: TillSessionRow): number | null =>
  r.closed_at ? new Date(r.closed_at).getTime() - new Date(r.opened_at).getTime() : null;

export const timingStats = (rows: TillSessionRow[]): TimingStats => {
  const closed = rows.filter((r) => r.closed_at);

  let longest: { r: TillSessionRow; ms: number } | null = null;
  let total = 0;
  let measured = 0;
  for (const r of closed) {
    const ms = durationMs(r);
    // A clock skew or a bad close can land a negative span; it would drag the
    // average somewhere impossible, so it is not an average of anything.
    if (ms == null || ms < 0) continue;
    total += ms;
    measured += 1;
    if (!longest || ms > longest.ms) longest = { r, ms };
  }

  return {
    avgOpen: meanTimeOfDay(rows.map((r) => minutesOfDay(r.opened_at))),
    avgClose: meanTimeOfDay(closed.map((r) => minutesOfDay(r.closed_at ?? r.opened_at))),
    avgDurationMs: measured > 0 ? Math.round(total / measured) : null,
    longest: longest?.r ?? null,
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
