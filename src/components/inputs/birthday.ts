/**
 * A birthday as the input kit holds it, and the arithmetic `BirthdayField`
 * needs: how long a month is, what can be picked, how it reads. No React.
 *
 * The year is optional by design. The loyalty programme stores a month and a
 * day and never a year (MadarRust migration 20260909140000: a greeting needs to
 * know WHEN, not how old), so the field can leave the year out entirely, offer
 * it with a "No year" choice, or require it.
 */
import { latinDigits } from "./time";

export interface Birthday {
  month: number | null;
  day: number | null;
  /** Absent or null: no year, because it was skipped or never asked for. */
  year?: number | null;
}

/** `none`: month and day only. `optional`: a year that may be skipped. `required`: a full date. */
export type YearMode = "none" | "optional" | "required";

/** A calendar day, 1-based month. */
export interface Ymd {
  y: number;
  m: number;
  d: number;
}

export const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * The longest a month can be. February keeps 29 when no year is known, so
 * someone born on the 29th can say so (the server greets them on the 28th in a
 * common year); a known common year gives it 28.
 */
export const daysIn = (month: number, year?: number | null): number =>
  month === 2 ? (year != null && !isLeap(year) ? 28 : 29) : [4, 6, 9, 11].includes(month) ? 30 : 31;

/** Both or neither: a month with no day greets nobody, a day with no month greets everyone twelve times. */
export const birthdayComplete = (b: Birthday): b is Birthday & { month: number; day: number } =>
  b.month !== null && b.day !== null;

export const EMPTY_BIRTHDAY: Birthday = { month: null, day: null, year: null };

/** The years on offer, newest first, and today (a birthday is never in the future). */
export interface BirthdayBounds {
  minYear: number;
  maxYear: number;
  today: Ymd;
}

export function birthdayBounds(today: Date = new Date(), minYear?: number, maxYear?: number): BirthdayBounds {
  const t = { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() };
  const max = Math.min(maxYear ?? t.y, t.y);
  return { minYear: Math.min(minYear ?? t.y - 110, max), maxYear: max, today: t };
}

/** The last month, and the last day of `month`, a birthday in `year` can be. */
export function limits(year: number | null | undefined, month: number, today: Ymd): { maxMonth: number; maxDay: number } {
  const thisYear = year === today.y;
  const maxMonth = thisYear ? today.m : 12;
  const longest = daysIn(month, year);
  return { maxMonth, maxDay: thisYear && month === today.m ? Math.min(today.d, longest) : longest };
}

/**
 * Pull a picked date back inside what is possible: 31 April is the 30th, 29
 * February in 2023 is the 28th, a year outside the bounds is the nearest one,
 * and a day after today in this year is today.
 */
export function clampBirthday(b: { month: number; day: number; year: number | null }, bounds: BirthdayBounds) {
  const year = b.year === null ? null : Math.min(Math.max(b.year, bounds.minYear), bounds.maxYear);
  const month = Math.min(Math.max(b.month, 1), limits(year, 12, bounds.today).maxMonth);
  const day = Math.min(Math.max(b.day, 1), limits(year, month, bounds.today).maxDay);
  return { month, day, year };
}

/**
 * Where the wheels start. What was picked before; else today's month and day,
 * the way a phone's own date picker opens. A required year starts thirty years
 * back (the middle of the people who fill in forms like this); an optional one
 * starts on "No year", so a year is only ever given on purpose.
 */
export function startingBirthday(value: Birthday, mode: YearMode, bounds: BirthdayBounds) {
  const year =
    mode === "none" ? null : value.year != null ? value.year : mode === "required" ? bounds.maxYear - 30 : null;
  if (birthdayComplete(value)) return clampBirthday({ month: value.month, day: value.day, year }, bounds);
  return clampBirthday({ month: bounds.today.m, day: bounds.today.d, year }, bounds);
}

/**
 * The page's locale's order of the three parts, as the platform writes a date:
 * day, month, year for `en-GB` and `ar-EG`; month, day, year for `en-US`.
 */
export function partOrder(locale: string): ("day" | "month" | "year")[] {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
      .formatToParts(Date.UTC(2000, 2, 17))
      .map((p) => p.type)
      .filter((t): t is "day" | "month" | "year" => t === "day" || t === "month" || t === "year");
  } catch {
    return ["day", "month", "year"];
  }
}

/** The twelve month names in the page's language, from the platform rather than a table. */
export function monthNames(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  return Array.from({ length: 12 }, (_, i) => fmt.format(Date.UTC(2000, i, 15)));
}

/**
 * "17 March", or "17 March 1990" with a year, in the page's language and with
 * Western digits (the app's numerals in both languages). 2000 stands in for a
 * missing year because it has a 29 February.
 */
export function formatBirthday(b: Birthday, locale: string): string {
  if (!birthdayComplete(b)) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    ...(b.year != null ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
    numberingSystem: "latn",
  }).format(Date.UTC(b.year ?? 2000, b.month - 1, b.day));
}

/** The first label that starts with what was typed (digits in either script, any case), or -1. */
export function typeaheadIndex(labels: string[], typed: string): number {
  const needle = latinDigits(typed).toLocaleLowerCase();
  if (!needle) return -1;
  return labels.findIndex((l) => latinDigits(l).toLocaleLowerCase().startsWith(needle));
}
