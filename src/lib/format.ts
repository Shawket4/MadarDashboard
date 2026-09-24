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

/**
 * Intl renders `en-GB`'s meridiem lowercase ("6:02 pm"); the POS and the
 * receipts print "PM". Uppercase it so both halves of the product read the
 * same. Arabic's ص/م is untouched.
 */
const upMeridiem = (s: string): string => s.replace(/\b([ap])\.?m\.?\b/gi, (_m, p: string) => `${p.toUpperCase()}M`);

const withTZ = (opts: Intl.DateTimeFormatOptions, tz?: string): Intl.DateTimeFormatOptions => ({
  // 12-hour clock and Western digits in both languages — the POS shape
  // (docs/design/SPEC.md §9): `06:02 PM`, Arabic `06:02 م`. Every time of day
  // the dashboard SHOWS goes through here; wire values (an `<input type=time>`,
  // an API `HH:MM`) are built separately and stay 24-hour.
  // Callers may still override `hour12`.
  hourCycle: "h12",
  numberingSystem: "latn",
  ...opts,
  timeZone: tz || getActiveTz(),
});

// ── Money ────────────────────────────────────────────────────────────────────

/** Convert piastres (integer) → EGP number (float) */
export const piastresToEgp = (p: number): number => p / 100;

/** Convert an EGP amount (user input) → integer piastres for the API.
 * Uses Math.round, not Math.trunc: `19.99 * 100` is `1998.9999…` in floating
 * point, which truncation would drop to 1998 (losing a piastre). */
export const egpToPiastres = (egp: number): number => Math.round(egp * 100);

// One money shape for the whole ecosystem — mirrors the POS core
// (madar/rust-core/crates/madar-core/src/display.rs):
//   en  EGP 1,234.50     −EGP 50.00      +EGP 20.00
//   ar  ⁦1,234.50⁩ ج.م   ⁦−50.00⁩ ج.م    ⁦+20.00⁩ ج.م
// Western digits in both languages, thousands grouped, a TRUE minus (U+2212),
// and in Arabic the figure is LTR-isolated so the bidi algorithm never moves
// the sign or splits the digits from their label.

export const MINUS = "\u2212";
export const LRI = "\u2066";
export const PDI = "\u2069";

/** Wrap a figure so it reads left-to-right inside RTL text. */
export const ltr = (s: string): string => `${LRI}${s}${PDI}`;

const CURRENCY_AR: Record<string, string> = {
  EGP: "ج.م",
  SAR: "ر.س",
  AED: "د.إ",
  KWD: "د.ك",
  QAR: "ر.ق",
  BHD: "د.ب",
  OMR: "ر.ع",
  JOD: "د.أ",
};

const isArabic = (): boolean => (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");

/** The currency's label in the active language: `EGP` / `ج.م`. */
export const currencyLabel = (code: string = DEFAULT_CURRENCY): string =>
  isArabic() ? (CURRENCY_AR[code] ?? code) : code;

const groupFigure = (abs: number, min: number, max: number): string =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    numberingSystem: "latn",
  }).format(abs);

/** Assemble the money shape from an absolute figure string and a sign. */
const moneyShape = (figure: string, sign: "" | "-" | "+"): string => {
  const signChar = sign === "-" ? MINUS : sign;
  const label = currencyLabel();
  return isArabic() ? `${ltr(`${signChar}${figure}`)} ${label}` : `${signChar}${label} ${figure}`;
};

/**
 * Format piastres as money. Two decimals by default (the POS shape);
 * `maxFractionDigits: 0` rounds to whole pounds for tight KPI slots.
 * null/undefined means "cost unknown", NOT free — renders an em-dash.
 */
export const fmtMoney = (
  piastres: number | null | undefined,
  opts?: { fractionDigits?: 0 | 2; maxFractionDigits?: number; signed?: boolean; currency?: boolean },
): string => {
  if (piastres === null || piastres === undefined || !Number.isFinite(piastres)) return "—";
  const value = piastresToEgp(piastres);
  const max = opts?.maxFractionDigits ?? Math.max(opts?.fractionDigits ?? 2, 2);
  const min = Math.min(opts?.fractionDigits ?? 2, max);
  const figure = groupFigure(Math.abs(value), min, max);
  const zero = Number(figure.replace(/,/g, "")) === 0;
  const sign: "" | "-" | "+" = zero ? "" : value < 0 ? "-" : opts?.signed ? "+" : "";
  if (opts?.currency === false) {
    const s = `${sign === "-" ? MINUS : sign}${figure}`;
    return isArabic() ? ltr(s) : s;
  }
  return moneyShape(figure, sign);
};

/** Signed ledger money: `+EGP 20.00` / `−EGP 50.00`. */
export const fmtMoneySigned = (piastres: number | null | undefined): string =>
  fmtMoney(piastres, { signed: true });

/** Compact variant — "EGP 1.2K". null/undefined renders an em-dash. */
export const fmtMoneyCompact = (piastres: number | null | undefined): string => {
  if (piastres === null || piastres === undefined || !Number.isFinite(piastres)) return "—";
  const value = piastresToEgp(piastres);
  const figure = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    numberingSystem: "latn",
  }).format(Math.abs(value));
  return moneyShape(figure, value < 0 && figure !== "0" ? "-" : "");
};

/** Plain number in locale */
export const fmtNumber = (n: number | null | undefined, opts?: Intl.NumberFormatOptions): string =>
  new Intl.NumberFormat(getLocale(), { numberingSystem: "latn", ...opts }).format(n ?? 0).replace(/-/g, MINUS);

/** Concise plain number — "2.2K" (en) / "٢٫٢ ألف" (ar). Locale-aware compact
 * notation (matches fmtMoneyCompact) so KPI cards stay readable in narrow cells
 * without mixing Latin "K" into Arabic. */
export const fmtNumberCompact = (n: number | null | undefined): string =>
  new Intl.NumberFormat(getLocale(), { notation: "compact", maximumFractionDigits: 1, numberingSystem: "latn" })
    .format(n ?? 0)
    .replace(/-/g, MINUS);

/** Percent with 1 decimal place */
export const fmtPercent = (ratio: number): string =>
  new Intl.NumberFormat(getLocale(), { style: "percent", maximumFractionDigits: 1, numberingSystem: "latn" })
    .format(ratio)
    .replace(/-/g, MINUS);

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
  return upMeridiem(new Intl.DateTimeFormat(
    getLocale(),
    withTZ({ hour: "2-digit", minute: "2-digit" }),
  ).format(new Date(iso)));
};

/** `tz`: the zone to read the instant in (a record's branch, AT-1); else the active one. */
export const fmtDateTime = (iso: string | Date | null | undefined, tz?: string | null): string => {
  if (!iso) return "—";
  return upMeridiem(new Intl.DateTimeFormat(
    getLocale(),
    withTZ({ day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }, tz ?? undefined),
  ).format(new Date(iso)));
};

export const fmtDateTimeFull = (iso: string | Date | null | undefined): string => {
  if (!iso) return "—";
  return upMeridiem(new Intl.DateTimeFormat(
    getLocale(),
    withTZ({
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  ).format(new Date(iso)));
};

/** Elapsed between two instants: `0m` · `42m` · `1h 05m` · `1d 03h` (ar `42 د` · `1 س 05 د`). */
export const fmtElapsedMs = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const ar = isArabic();
  const [d, h, m] = ar ? ["ي", "س", "د"] : ["d", "h", "m"];
  const sep = ar ? " " : "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const mins = Math.floor(ms / 60_000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rest = mins % 60;
  const out =
    days > 0
      ? `${days}${sep}${d} ${pad(hours)}${sep}${h}`
      : hours > 0
        ? `${hours}${sep}${h} ${pad(rest)}${sep}${m}`
        : `${rest}${sep}${m}`;
  return ar ? ltr(out) : out;
};

export const fmtDuration = (start: string | null | undefined, end?: string | null): string => {
  if (!start) return "—";
  const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms)) return "—";
  return fmtElapsedMs(ms);
};

/**
 * A moment in the branch timezone, as short as it can be without ambiguity:
 * `06:02 PM` today · `12 Sep · 06:02 PM` this year · `31 Dec 2025 · 11:30 PM`
 * otherwise.
 */
export const fmtStamp = (iso: string | Date | null | undefined, now: Date = new Date()): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "—";
  const tz = getActiveTz();
  const dayKey = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(x);
  const time = upMeridiem(new Intl.DateTimeFormat(getLocale(), withTZ({ hour: "2-digit", minute: "2-digit" })).format(d));
  if (dayKey(d) === dayKey(now)) return time;
  const sameYear = dayKey(d).slice(0, 4) === dayKey(now).slice(0, 4);
  const date = new Intl.DateTimeFormat(
    getLocale(),
    withTZ(sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" }),
  ).format(d);
  return `${date} · ${time}`;
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
  // TZDate#toISOString keeps the zone offset; send a plain UTC "Z" instant.
  return new Date(+d).toISOString();
};

/** Extract calendar parts {y,m,d} from an ISO string in the active timezone */
export const cairoParts = (iso: string): { y: number; m: number; d: number } => {
  const d = new TZDate(iso, getActiveTz());
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
};

/** Format a period timestamp for charts based on granularity */
export const fmtPeriod = (iso: string, granularity: "hourly" | "daily" | "monthly" | "peak_hours" | "peak_days"): string => {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions =
    granularity === "hourly"
      ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
      : granularity === "monthly"
        ? { month: "short", year: "numeric" }
        : { month: "short", day: "numeric" };
  return upMeridiem(new Intl.DateTimeFormat(getLocale(), withTZ(opts)).format(d));
};

/**
 * A wall-clock hour+minute rendered 12-hour in the app language, independent
 * of any timezone — for labels built from parts (a chart's hour bucket, a
 * stored `HH:MM`) rather than from an instant.
 */
const clockLabel = (hour: number, minute: number): string => {
  const out = new Intl.DateTimeFormat(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h12",
    numberingSystem: "latn",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 0, 1, hour, minute)));
  return upMeridiem(out);
};

/** Format a 0-23 hour integer as a 12-hour clock label: 0→"12:00 AM", 13→"01:00 PM". */
export const fmtHour = (h: number): string => clockLabel(((h % 24) + 24) % 24, 0);

/**
 * A wire `HH:MM` (an API field, an `<input type=time>` value) read back for
 * DISPLAY, 12-hour. Anything that is not `HH:MM` passes through unchanged.
 */
export const fmtWireTime = (hhmm: string): string => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? "");
  if (!m) return hhmm;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return hhmm;
  return clockLabel(h, min);
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

/**
 * The stored value of a discount — a FRACTION for a percentage, minor units
 * for a fixed one.
 *
 * Read `value_rate`, never `value`. `value` is the LEGACY spelling on the
 * wire: an integer, 0-100 for a percentage, kept because every till in the
 * field was generated against `integer` and a double there fails to
 * deserialise the whole object rather than reading as a small number. Reading
 * `value` as if it were the fraction shows 14% as 1400%.
 *
 * The fallback exists for a server that predates the split, not as a
 * preference: if `value_rate` is absent, `value` still carries 0-100 and has
 * to come back down.
 */
export const rateOf = (d: {
  value: number;
  value_rate?: number;
  dtype?: string;
}): number =>
  d.value_rate ?? (d.dtype === "percentage" ? d.value / 100 : d.value);
