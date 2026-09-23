/**
 * The roster's week starts on Saturday (Egypt), in the server's `week_start`.
 * Dates are ISO `yyyy-mm-dd` strings, handled as calendar dates — never
 * through a time zone, so a branch's day is the day the server named.
 */
const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (iso: string, n: number): string => {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
};

/** The Saturday on or before `iso`. */
export const weekStartOf = (iso: string): string => {
  const dow = toDate(iso).getUTCDay(); // 0 = Sunday … 6 = Saturday
  return addDays(iso, -((dow + 1) % 7));
};

export const weekDays = (start: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(start, i));

/** 0 = Sunday … 6 = Saturday, the backend's weekday numbering. */
export const weekdayOf = (iso: string): number => toDate(iso).getUTCDay();
