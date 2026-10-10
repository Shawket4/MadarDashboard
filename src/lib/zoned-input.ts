/**
 * `<input type="datetime-local">` in a named zone (AT-1).
 *
 * The input has no zone: the browser reads it in the DEVICE's zone, so an
 * owner abroad (or a laptop left on UTC) typing "09:00" for a Cairo branch
 * wrote 09:00 UTC. These read and write the wall clock of the branch's zone
 * with madar-time's `local_parts` / `local_instant` (WebAssembly, `@/lib/rules`);
 * zoned-input.test.ts runs them against the pinned wallclock_vectors.json.
 */
import { rules } from "@/lib/rules";

const pad = (n: number) => String(n).padStart(2, "0");

/** An instant as `yyyy-MM-ddTHH:mm` on `tz`'s wall clock; "" for none. */
export function toZonedInput(iso: string | null | undefined, tz: string): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const { date, hour, minute } = rules.local_parts(tz, ms);
  return `${date}T${pad(hour)}:${pad(minute)}`;
}

/**
 * `yyyy-MM-ddTHH:mm` read on `tz`'s wall clock, as a UTC ISO instant; null for
 * "" or a day that does not exist. A time that happens twice is the earliest;
 * one in a DST gap moves forward by the gap.
 */
export function fromZonedInput(local: string, tz: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return null;
  try {
    return new Date(rules.local_instant(tz, m[1], Number(m[2]), Number(m[3]))).toISOString();
  } catch {
    return null; // 2026-02-30: local_instant refuses a date that is not on the calendar
  }
}
