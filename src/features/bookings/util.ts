/**
 * Shared vocabulary for the bookings surfaces: status tones, the booking day
 * (plain calendar date in the branch zone, matching the backend), timeline geometry,
 * and local-time helpers. Pure — everything here is unit-tested.
 */
import { z } from "zod";

import { queryClient } from "@/data/api/query";
import { businessDate, fmtHour, getActiveTz } from "@/lib/format";
import { rules } from "@/lib/rules";
import { canonicalPhone, formatPhoneInput, phoneSchema } from "@/lib/phone";
import type { BookingSettings } from "@/data/api/generated/models/bookingSettings";
import type { BookingView } from "@/data/api/generated/models/bookingView";

/**
 * Who the booking is for — the typed part of the booking form. Messages are
 * i18n keys. The phone follows the one shared rule (`src/lib/phone.ts`).
 */
export const bookingGuestSchema = z.object({
  guest_name: z.string().trim().min(1, { message: "bookings.errName" }),
  guest_phone: phoneSchema({ required: true, messages: { required: "bookings.errPhoneRequired", invalid: "bookings.errPhone" } }),
  notes: z.string(),
});

export type BookingGuestValues = z.infer<typeof bookingGuestSchema>;

/** The form's values for a booking being edited (or a blank one). */
export const guestValuesOf = (
  b?: Pick<BookingView, "guest_name" | "guest_phone" | "notes"> | null,
): BookingGuestValues => ({
  guest_name: b?.guest_name ?? "",
  // Stored canonical (`201…`); shown the way a host would type it.
  guest_phone: formatPhoneInput(b?.guest_phone),
  notes: b?.notes ?? "",
});

/** What goes on the wire: the canonical phone. The schema has already vouched for it. */
export const guestPhoneToWire = (typed: string): string => canonicalPhone(typed) ?? typed.trim();

export const BOOKING_STATUSES = ["confirmed", "seated", "completed", "no_show", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Status tones for StatusPill (glyph + label, never colour alone). */
export const STATUS_TONES: Record<BookingStatus, "accent" | "success" | "neutral" | "danger"> = {
  confirmed: "accent",
  seated: "success",
  completed: "neutral",
  no_show: "danger",
  cancelled: "neutral",
};

export const isActive = (b: Pick<BookingView, "status">): boolean =>
  b.status === "confirmed" || b.status === "seated";

export const invalidateBookings = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" &&
      ((q.queryKey[0] as string).startsWith("/bookings") || (q.queryKey[0] as string).startsWith("/floor")),
  });

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

/** Today's calendar date (`YYYY-MM-DD`) in `tz` for the instant `now`; rolls over at midnight (madar-time `business_date`). */
export function serviceToday(now: Date = new Date(), tz: string = getActiveTz()): string {
  return businessDate(now, tz);
}

/** The calendar date (`YYYY-MM-DD`) an instant falls on in `tz` — the day a booking is listed under. */
export const serviceDateOf = (iso: string, tz: string = getActiveTz()): string => serviceToday(new Date(iso), tz);

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

/** An instant for `date` + `HH:MM` wall-clock in `tz` (madar-time `local_instant`: a repeated time is the earliest, a DST-gap time moves forward by the gap). */
export function localInstant(date: string, hhmm: string, tz: string = getActiveTz()): string {
  const [hh, mm] = hhmm.split(":").map(Number);
  return new Date(rules.local_instant(tz, date, hh, mm)).toISOString();
}

/** `HH:MM` wall-clock of an instant in `tz` (madar-time `local_parts`). */
export function localHHMM(iso: string, tz: string = getActiveTz()): string {
  const { hour, minute } = rules.local_parts(tz, new Date(iso).getTime());
  return `${pad(hour)}:${pad(minute)}`;
}

/** Minutes since midnight for `HH:MM`. */
export const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * The day's timeline window in minutes-from-midnight, from the branch hours
 * for that weekday. A day is midnight → midnight, so hours that run past
 * midnight widen the window to the whole day (early-morning bookings sit at
 * the start of their own date). Falls back
 * to noon–midnight when the day has no hours, so the board still draws.
 */
export function dayWindow(settings: BookingSettings | undefined, date: string): { open: number; close: number } {
  const entry = settings?.hours.find((h) => h.dow === weekdayOf(date));
  if (!entry) return { open: 12 * 60, close: 24 * 60 };
  const open = minutesOf(entry.open);
  const close = minutesOf(entry.close);
  if (close <= open) return { open: 0, close: 24 * 60 };
  return { open, close };
}

/**
 * Where a booking sits on the day's timeline, as percentages of the window.
 * Minutes are measured from the date's local midnight.
 */
export function timelineSpan(
  b: Pick<BookingView, "starts_at" | "ends_at">,
  date: string,
  window: { open: number; close: number },
  tz: string = getActiveTz(),
): { left: number; width: number } {
  const [dayStart] = rules.day_bounds(tz, date);
  const toMin = (iso: string) => (new Date(iso).getTime() - dayStart) / 60_000;
  const span = window.close - window.open;
  const start = Math.max(toMin(b.starts_at), window.open);
  const end = Math.min(toMin(b.ends_at), window.close);
  const left = ((start - window.open) / span) * 100;
  const width = Math.max(((end - start) / span) * 100, 1.5);
  return { left: Math.max(0, Math.min(left, 100)), width: Math.min(width, 100 - Math.max(0, left)) };
}

/** Hour ticks across the window, as 12-hour labels with their left %. */
export function hourTicks(window: { open: number; close: number }): { label: string; left: number }[] {
  const out: { label: string; left: number }[] = [];
  const span = window.close - window.open;
  for (let m = Math.ceil(window.open / 60) * 60; m <= window.close; m += 60) {
    out.push({ label: fmtHour((m / 60) % 24), left: ((m - window.open) / span) * 100 });
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
