/** Pure helpers for the public reservations site (branch-zone rendering). */

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` ± n days, calendar arithmetic only. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const u = new Date(Date.UTC(y, m - 1, d + n));
  return `${u.getUTCFullYear()}-${pad(u.getUTCMonth() + 1)}-${pad(u.getUTCDate())}`;
}

/** The dates a guest may pick: today through the horizon. */
export function pickableDates(today: string, horizonDays: number): string[] {
  return Array.from({ length: horizonDays + 1 }, (_, i) => addDays(today, i));
}

const locale = (lang: string) => (lang.startsWith("ar") ? "ar-EG" : "en-GB");

/** "19:30" in the branch zone. */
export const fmtSlot = (iso: string, tz: string, lang = "en"): string =>
  new Intl.DateTimeFormat(locale(lang), { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz }).format(new Date(iso));

/** "Thu 10 Sep" for a `YYYY-MM-DD`. */
export const fmtDay = (date: string, lang = "en", opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string => {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale(lang), { ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
};

/** "Thu 10 Sep, 19:30" for an instant, in the branch zone. */
export const fmtWhen = (iso: string, tz: string, lang = "en"): string =>
  new Intl.DateTimeFormat(locale(lang), {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz,
  }).format(new Date(iso));

/** Weekday name for a `dow` (0 = Sunday). */
export const dowName = (dow: number, lang = "en"): string =>
  new Intl.DateTimeFormat(locale(lang), { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + dow)));
