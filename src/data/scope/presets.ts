import { TZDate } from "@date-fns/tz";
import { getActiveTz } from "@/lib/format";

export type ScopePreset = "today" | "yesterday" | "7d" | "30d" | "mtd" | "custom";

export const SCOPE_PRESETS: Exclude<ScopePreset, "custom">[] = ["today", "yesterday", "7d", "30d", "mtd"];

export const DEFAULT_PRESET: ScopePreset = "30d";

/** UTC ISO instant for the start (or last ms) of a calendar day in `tz`. */
export const dayBoundaryISO = (tz: string, y: number, m: number, d: number, endOfDay = false): string =>
  // TZDate#toISOString keeps the zone offset; normalise to a plain UTC "Z" instant.
  new Date(+(endOfDay ? new TZDate(y, m, d, 23, 59, 59, 999, tz) : new TZDate(y, m, d, 0, 0, 0, 0, tz))).toISOString();

/**
 * [from, to] UTC instants for a named preset, day-bounded in the calendar of
 * `tz` (the active branch tz, or org tz for the all-branches roll-up).
 * Day offsets use calendar arithmetic in `tz`, so DST days stay 23/25h long.
 */
export const rangeForPreset = (
  preset: Exclude<ScopePreset, "custom">,
  tz: string = getActiveTz(),
  now: Date | number = Date.now(),
): { from: string; to: string } => {
  const n = new TZDate(typeof now === "number" ? now : now.getTime(), tz);
  const y = n.getFullYear();
  const m = n.getMonth();
  const d = n.getDate();
  // new TZDate normalises day overflow/underflow (e.g. d - 29) in `tz`.
  const day = (offset: number) => new TZDate(y, m, d + offset, tz);
  const start = (p: TZDate) => dayBoundaryISO(tz, p.getFullYear(), p.getMonth(), p.getDate());
  const end = (p: TZDate) => dayBoundaryISO(tz, p.getFullYear(), p.getMonth(), p.getDate(), true);
  switch (preset) {
    case "today":
      return { from: start(day(0)), to: end(day(0)) };
    case "yesterday":
      return { from: start(day(-1)), to: end(day(-1)) };
    case "7d":
      return { from: start(day(-6)), to: end(day(0)) };
    case "30d":
      return { from: start(day(-29)), to: end(day(0)) };
    case "mtd":
      return { from: dayBoundaryISO(tz, y, m, 1), to: end(day(0)) };
  }
};
