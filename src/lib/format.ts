import { APP_TZ, DEFAULT_CURRENCY, DEFAULT_LOCALE_AR, DEFAULT_LOCALE_EN } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";
import i18n from "@/i18n";
import { TZDate } from "@date-fns/tz";

type Lang = "en" | "ar";

const getLocale = (): string => {
  const lang = (i18n.resolvedLanguage ?? i18n.language ?? "en") as Lang;
  return lang === "ar" ? DEFAULT_LOCALE_AR : DEFAULT_LOCALE_EN;
};

/**
 * The timezone every formatter renders in. This is the branch/org's configured
 * zone (resolved by `useSyncTimezone` into the app store) — NEVER the device's
 * browser timezone. Falls back to APP_TZ before the scope's tz is known.
 */
export const getActiveTz = (): string => useAppStore.getState().activeTimezone || APP_TZ;

const withTZ = (opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  // Render all times in 12-hour (AM/PM) form; ignored by date-only formats.
  // Callers may still override by passing their own `hour12`.
  hour12: true,
  ...opts,
  timeZone: getActiveTz(),
});

// ── Money ────────────────────────────────────────────────────────────────────

/** Convert piastres (integer) → EGP number (float) */
export const piastresToEgp = (p: number): number => p / 100;

/** Convert an EGP amount (user input) → integer piastres for the API.
 * Uses Math.round, not Math.trunc: `19.99 * 100` is `1998.9999…` in floating
 * point, which truncation would drop to 1998 (losing a piastre). */
export const egpToPiastres = (egp: number): number => Math.round(egp * 100);

/**
 * Format piastres as currency in user's locale.
 * null/undefined means "cost unknown", NOT free — renders an em-dash.
 */
export const fmtMoney = (
  piastres: number | null | undefined,
  opts?: { fractionDigits?: 0 | 2; maxFractionDigits?: number },
): string => {
  if (piastres === null || piastres === undefined) return "—";
  const value = piastresToEgp(piastres);
  // No forced trailing zeros: 1872.00 → "1,872", 1872.5 → "1,872.5", max 2 dp.
  const min = opts?.fractionDigits ?? 0;
  const max = Math.max(min, opts?.maxFractionDigits ?? 2);
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(value);
};

/** Compact variant — "EGP 1.2K" style. null/undefined renders an em-dash. */
export const fmtMoneyCompact = (piastres: number | null | undefined): string => {
  if (piastres === null || piastres === undefined) return "—";
  const value = piastresToEgp(piastres);
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

/** Plain number in locale */
export const fmtNumber = (n: number | null | undefined, opts?: Intl.NumberFormatOptions): string =>
  new Intl.NumberFormat(getLocale(), opts).format(n ?? 0);

/** Concise plain number — "2.2K" (en) / "٢٫٢ ألف" (ar). Locale-aware compact
 * notation (matches fmtMoneyCompact) so KPI cards stay readable in narrow cells
 * without mixing Latin "K" into Arabic. */
export const fmtNumberCompact = (n: number | null | undefined): string =>
  new Intl.NumberFormat(getLocale(), { notation: "compact", maximumFractionDigits: 1 }).format(n ?? 0);

/** Percent with 1 decimal place */
export const fmtPercent = (ratio: number): string =>
  new Intl.NumberFormat(getLocale(), { style: "percent", maximumFractionDigits: 1 }).format(ratio);

/** Safe share of a part over total */
export const fmtShare = (part: number, total: number): string => {
  if (!total) return fmtPercent(0);
  return fmtPercent(part / total);
};

// ── Dates ────────────────────────────────────────────────────────────────────

export const fmtDate = (iso: string | Date | null | undefined): string => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(
    getLocale(),
    withTZ({ day: "2-digit", month: "short", year: "numeric" }),
  ).format(new Date(iso));
};

export const fmtTime = (iso: string | Date | null | undefined): string => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(
    getLocale(),
    withTZ({ hour: "2-digit", minute: "2-digit" }),
  ).format(new Date(iso));
};

export const fmtDateTime = (iso: string | Date | null | undefined): string => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(
    getLocale(),
    withTZ({ day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
  ).format(new Date(iso));
};

export const fmtDateTimeFull = (iso: string | Date | null | undefined): string => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(
    getLocale(),
    withTZ({
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  ).format(new Date(iso));
};

export const fmtDuration = (start: string | null | undefined, end?: string | null): string => {
  if (!start) return "—";
  const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms)) return "—";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// NOTE: these `cairo*` helpers are named for the historical default but resolve
// the *active* branch/org timezone (getActiveTz()), so report day-boundaries
// follow the configured zone rather than the device's. Names kept to avoid churn.

/** "now" in the active branch/org timezone — useful for date range logic */
export const cairoNow = (): TZDate => new TZDate(Date.now(), getActiveTz());

/** ISO instant for a calendar day (start or end) in the active timezone */
export const cairoDateISO = (year: number, month: number, day: number, endOfDay = false): string => {
  const d = new TZDate(
    year,
    month,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
    getActiveTz(),
  );
  return d.toISOString();
};

/** Extract calendar parts {y,m,d} from an ISO string in the active timezone */
export const cairoParts = (iso: string): { y: number; m: number; d: number } => {
  const d = new TZDate(iso, getActiveTz());
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
};

/** Format a period timestamp for charts based on granularity */
export const fmtPeriod = (iso: string, granularity: "hourly" | "daily" | "monthly" | "peak_hours"): string => {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions =
    granularity === "hourly"
      ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
      : granularity === "monthly"
        ? { month: "short", year: "numeric" }
        : { month: "short", day: "numeric" };
  return new Intl.DateTimeFormat(getLocale(), withTZ(opts)).format(d);
};

/** Format a 0-23 hour integer as 12-hour clock label: 0→"12am", 13→"1pm", etc. */
export const fmtHour = (h: number): string => {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
};

// ── Miscellaneous ────────────────────────────────────────────────────────────

export const initials = (name = ""): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export const fmtUnit = (unit: string | null | undefined): string => {
  const map: Record<string, string> = { g: "g", kg: "kg", ml: "ml", l: "L", pcs: "pcs" };
  return unit ? (map[unit] ?? unit) : "";
};
