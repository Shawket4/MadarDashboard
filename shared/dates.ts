/**
 * Dates shown to people, from one place, so nothing writes a year by hand.
 *
 * Everything Madar shows is anchored to Cairo time (DESIGN.md), and numerals follow
 * the language: Arabic pages write the year in Arabic-Indic digits (٢٠٢٦), English
 * ones in Western digits (2026). The dashboard and the customer bundles call it as
 * the page renders; the marketing site calls it at build time (each deploy).
 */

/** Madar's clock. */
export const MADAR_TIME_ZONE = "Africa/Cairo";

/** The locale numerals and dates are written in, for a page in `lang`. */
export function displayLocale(lang: string): string {
  return lang.toLowerCase().startsWith("ar") ? "ar-EG" : "en-GB";
}

/** The current year in Cairo, written for a page in `lang`: "2026" or "٢٠٢٦". */
export function currentYear(lang: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat(displayLocale(lang), { year: "numeric", timeZone: MADAR_TIME_ZONE }).format(now);
}
