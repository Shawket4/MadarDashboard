import { cairoParts, dayBoundaryISO, getActiveTz } from "@/lib/format";

export { dayBoundaryISO };

export type ScopePreset = "today" | "yesterday" | "7d" | "30d" | "mtd" | "custom";

export const SCOPE_PRESETS: Exclude<ScopePreset, "custom">[] = ["today", "yesterday", "7d", "30d", "mtd"];

/** Not `custom`: a default period has to be one the app can resolve on its own. */
export const DEFAULT_PRESET: Exclude<ScopePreset, "custom"> = "30d";

/**
 * [from, to] UTC instants for a named preset, day-bounded in the calendar of
 * `tz` (the active branch tz, or org tz for the all-branches roll-up).
 * Today is madar-time's business date; the day offsets are calendar days, so
 * DST days stay 23/25h long (dayBoundaryISO rolls an offset over the month).
 */
export const rangeForPreset = (
  preset: Exclude<ScopePreset, "custom">,
  tz: string = getActiveTz(),
  now: Date | number = Date.now(),
): { from: string; to: string } => {
  const { y, m, d } = cairoParts(now, tz);
  const start = (offset: number) => dayBoundaryISO(tz, y, m, d + offset);
  const end = (offset: number) => dayBoundaryISO(tz, y, m, d + offset, true);
  switch (preset) {
    case "today":
      return { from: start(0), to: end(0) };
    case "yesterday":
      return { from: start(-1), to: end(-1) };
    case "7d":
      return { from: start(-6), to: end(0) };
    case "30d":
      return { from: start(-29), to: end(0) };
    case "mtd":
      return { from: dayBoundaryISO(tz, y, m, 1), to: end(0) };
  }
};
