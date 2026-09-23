/**
 * `<input type="datetime-local">` in a named zone (AT-1).
 *
 * The input has no zone: the browser reads it in the DEVICE's zone, so an
 * owner abroad (or a laptop left on UTC) typing "09:00" for a Cairo branch
 * wrote 09:00 UTC. These read and write the wall clock of the branch's zone.
 */
import { TZDate } from "@date-fns/tz";

const pad = (n: number) => String(n).padStart(2, "0");

/** An instant as `yyyy-MM-ddTHH:mm` on `tz`'s wall clock; "" for none. */
export function toZonedInput(iso: string | null | undefined, tz: string): string {
  if (!iso) return "";
  const d = new TZDate(new Date(iso).getTime(), tz);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `yyyy-MM-ddTHH:mm` read on `tz`'s wall clock, as a UTC ISO instant; null for "". */
export function fromZonedInput(local: string, tz: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  return new Date(new TZDate(y, mo - 1, d, h, mi, tz).getTime()).toISOString();
}
