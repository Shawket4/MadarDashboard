/**
 * Shared vocabulary for the bookings surfaces: status tones, the service day
 * (05:00 → 05:00 in the branch zone, matching the backend), timeline geometry,
 * and local-time helpers. Pure — everything here is unit-tested.
 */
import { TZDate } from "@date-fns/tz";

import { queryClient } from "@/data/api/query";
import { getActiveTz } from "@/lib/format";
import type { BookingSettings } from "@/data/api/generated/models/bookingSettings";
import type { BookingView } from "@/data/api/generated/models/bookingView";

export const BOOKING_STATUSES = ["confirmed", "seated", "completed", "no_show", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed: "bg-info/10 text-info",
  seated: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export const isActive = (b: Pick<BookingView, "status">): boolean =>
  b.status === "confirmed" || b.status === "seated";

export const invalidateBookings = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" &&
      ((q.queryKey[0] as string).startsWith("/bookings") || (q.queryKey[0] as string).startsWith("/floor")),
  });

/** The backend's service day starts at 05:00 local, so a 00:30 booking is "last night". */
export const DAY_CUTOFF_HOUR = 5;

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

/** Today's service date (`YYYY-MM-DD`) in `tz` for the instant `now`. */
export function serviceToday(now: Date = new Date(), tz: string = getActiveTz()): string {
  const z = new TZDate(now.getTime(), tz);
  const shifted = z.getHours() < DAY_CUTOFF_HOUR ? new TZDate(z.getTime() - 24 * 3_600_000, tz) : z;
  return ymd(shifted.getFullYear(), shifted.getMonth(), shifted.getDate());
}

/** `YYYY-MM-DD` ± n days (calendar arithmetic, timezone-free). */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const u = new Date(Date.UTC(y, m - 1, d + n));
  return ymd(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
}

/** 0 = Sunday … 6 = Saturday, for a `YYYY-MM-DD`. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** An instant for `date` + `HH:MM` wall-clock in `tz`. */
export function localInstant(date: string, hhmm: string, tz: string = getActiveTz()): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  // `TZDate.toISOString` keeps the zone offset; the API wants the plain instant.
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, 0, tz).getTime()).toISOString();
}

/** `HH:MM` wall-clock of an instant in `tz`. */
export function localHHMM(iso: string, tz: string = getActiveTz()): string {
  const z = new TZDate(iso, tz);
  return `${pad(z.getHours())}:${pad(z.getMinutes())}`;
}

/** Minutes since midnight for `HH:MM`. */
export const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * The day's timeline window in minutes-from-midnight, from the branch hours
 * for that weekday (a close at or before open runs past midnight). Falls back
 * to noon–midnight when the day has no hours, so the board still draws.
 */
export function dayWindow(settings: BookingSettings | undefined, date: string): { open: number; close: number } {
  const entry = settings?.hours.find((h) => h.dow === weekdayOf(date));
  if (!entry) return { open: 12 * 60, close: 24 * 60 };
  const open = minutesOf(entry.open);
  let close = minutesOf(entry.close);
  if (close <= open) close += 24 * 60;
  return { open, close };
}

/**
 * Where a booking sits on the day's timeline, as percentages of the window.
 * A booking after midnight lands past 24:00 on the previous service day, which
 * is exactly where the window extends to.
 */
export function timelineSpan(
  b: Pick<BookingView, "starts_at" | "ends_at">,
  date: string,
  window: { open: number; close: number },
  tz: string = getActiveTz(),
): { left: number; width: number } {
  const dayStart = new TZDate(...(date.split("-").map(Number) as [number, number, number]).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number], tz).getTime();
  const toMin = (iso: string) => (new Date(iso).getTime() - dayStart) / 60_000;
  const span = window.close - window.open;
  const start = Math.max(toMin(b.starts_at), window.open);
  const end = Math.min(toMin(b.ends_at), window.close);
  const left = ((start - window.open) / span) * 100;
  const width = Math.max(((end - start) / span) * 100, 1.5);
  return { left: Math.max(0, Math.min(left, 100)), width: Math.min(width, 100 - Math.max(0, left)) };
}

/** Hour ticks across the window, as `HH:00` labels with their left %. */
export function hourTicks(window: { open: number; close: number }): { label: string; left: number }[] {
  const out: { label: string; left: number }[] = [];
  const span = window.close - window.open;
  for (let m = Math.ceil(window.open / 60) * 60; m <= window.close; m += 60) {
    out.push({ label: `${pad((m / 60) % 24)}:00`, left: ((m - window.open) / span) * 100 });
  }
  return out;
}

/** Day-level tallies for the stats strip. */
export function dayTotals(list: BookingView[]) {
  let covers = 0;
  let seated = 0;
  let noShow = 0;
  let needsTable = 0;
  for (const b of list) {
    if (b.status === "seated" || b.status === "completed") covers += b.party_size;
    if (b.status === "seated") seated += 1;
    if (b.status === "no_show") noShow += 1;
    if (b.needs_table) needsTable += 1;
  }
  return { total: list.length, covers, seated, noShow, needsTable };
}

/** The booking's hold has begun (the floor tints its tables). */
export const isHeld = (b: Pick<BookingView, "status" | "held_from">, now: Date = new Date()): boolean =>
  b.status === "confirmed" && new Date(b.held_from).getTime() <= now.getTime();

/** Is the party late — confirmed, past its start, not yet seated? */
export const isLate = (b: Pick<BookingView, "status" | "starts_at">, now: Date = new Date()): boolean =>
  b.status === "confirmed" && new Date(b.starts_at).getTime() < now.getTime();
