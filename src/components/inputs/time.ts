/**
 * The clock vocabulary behind the input kit: reading what a person typed,
 * writing a wall-clock time back out, and the arithmetic of a shift that may
 * run past midnight. Pure functions, no React: the fields and their tests
 * share them.
 *
 * The wire shape is 24-hour `HH:MM` (an API `NaiveTime` minus its seconds).
 * What a person READS follows the app's clock rule (docs/design/SPEC.md §9):
 * 12-hour with Western digits in both languages, `09:30 PM` / `09:30 م`.
 * A field can still ask for a 24-hour face.
 */

export type HourCycle = "h12" | "h23";
export type Lang = "en" | "ar";

/** Minutes in a day. */
export const DAY_MIN = 24 * 60;

/**
 * The clock face every time field shows unless told otherwise. The whole
 * product (dashboard, POS, receipts) reads 12-hour in English and Arabic, so
 * "the locale's clock" is 12-hour for both of this app's locales.
 */
export const APP_HOUR_CYCLE: HourCycle = "h12";

const pad = (n: number) => String(n).padStart(2, "0");

/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Latin, so an Arabic keyboard types a time too. */
export const latinDigits = (s: string): string =>
  s
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0));

/** `HH:MM[:SS]` → `HH:MM`, or `""` when it isn't a time. Accepts the API's seconds. */
export const toHHMM = (v: string | null | undefined): string => {
  const m = /^(\d{1,2}):(\d{2})/.exec(v ?? "");
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? `${pad(h)}:${pad(min)}` : "";
};

/** `HH:MM` → `HH:MM:00` for the API; `""` stays `""`. */
export const toWire = (hhmm: string): string => (hhmm ? `${toHHMM(hhmm)}:00` : "");

/** Minutes since midnight of `HH:MM[:SS]`, or `null`. */
export const minutesOf = (v: string | null | undefined): number | null => {
  const s = toHHMM(v);
  if (!s) return null;
  return Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
};

/** Minutes since midnight → `HH:MM`, wrapping around the day. */
export const hhmmOf = (minutes: number): string => {
  const m = ((Math.round(minutes) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

const AM_WORDS = /^(a|am|ص|صباحا|صباحًا|صباح)$/;
const PM_WORDS = /^(p|pm|م|مساء|مساءً|مساءا)$/;

/**
 * Read a time the way people type one. Returns `HH:MM`, or `null` when it
 * can't be read. Empty input is `null` too: the caller decides whether empty
 * is allowed.
 *
 * - digits alone: `9` → 09:00, `930` → 09:30, `0930` / `2130` → as written, `17` → 17:00
 * - separators: `9:30`, `9.30`, `9 30`, `21:5` is refused (minutes are two digits)
 * - a meridiem in either language: `9p`, `9:30 pm`, `930م`, `12am` → 00:00, `12 pm` → 12:00
 * - Arabic-Indic digits: `٩:٣٠ م` → 21:30
 * - `24:00` → 00:00 (a common way to write midnight)
 *
 * Without a meridiem the hour is read on the 24-hour clock, whatever the
 * face: the field shows the 12-hour reading at once, so `5` visibly becomes
 * 05:00 AM rather than silently guessing PM.
 */
export function parseTime(raw: string): string | null {
  let s = latinDigits(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    // "p.m." / "a.m" / "p." → "pm" / "am" / "p", so the dots don't read as separators.
    .replace(/([ap])\.\s?m\.?$/, "$1m")
    .replace(/([ap])m?\.$/, (m) => m.slice(0, -1));
  if (!s) return null;

  let meridiem: "am" | "pm" | null = null;
  const tail = /^(.*?[0-9])\s*([^\d\s:.,٫]+)$/u.exec(s);
  if (tail) {
    const word = tail[2].replace(/\s/g, "");
    if (AM_WORDS.test(word)) meridiem = "am";
    else if (PM_WORDS.test(word)) meridiem = "pm";
    else return null;
    s = tail[1].trim();
  }

  let h: number;
  let m: number;
  const sep = /^(\d{1,2})\s*[:.,٫ ]\s*(\d{2})$/.exec(s);
  if (sep) {
    h = Number(sep[1]);
    m = Number(sep[2]);
  } else if (/^\d{1,4}$/.test(s)) {
    if (s.length <= 2) {
      h = Number(s);
      m = 0;
    } else {
      h = Number(s.slice(0, s.length - 2));
      m = Number(s.slice(-2));
    }
  } else {
    return null;
  }

  if (m > 59) return null;
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    if (meridiem === "am") h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
  } else if (h === 24 && m === 0) {
    h = 0;
  } else if (h > 23) {
    return null;
  }
  return `${pad(h)}:${pad(m)}`;
}

/** The meridiem word in the app language. */
export const meridiemOf = (hour: number, lang: Lang): string =>
  lang === "ar" ? (hour < 12 ? "ص" : "م") : hour < 12 ? "AM" : "PM";

/**
 * `HH:MM` for a person to read: `09:30 PM` / `09:30 م` on the 12-hour face,
 * `21:30` on the 24-hour one. Always Western digits. `""` for no time.
 */
export function formatTime(hhmm: string | null | undefined, opts: { hourCycle?: HourCycle; lang?: Lang } = {}): string {
  const min = minutesOf(hhmm);
  if (min === null) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if ((opts.hourCycle ?? APP_HOUR_CYCLE) === "h23") return `${pad(h)}:${pad(m)}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(m)} ${meridiemOf(h, opts.lang ?? "en")}`;
}

/**
 * How long a shift from `start` to `end` lasts, in minutes. An end at or
 * before the start runs into the next day (22:00 → 06:00 is 480), which is how
 * the server reads it too. `null` when either end is missing; `0` when they
 * are the same time (never a valid shift).
 */
export function spanMinutes(start: string | null | undefined, end: string | null | undefined): number | null {
  const a = minutesOf(start);
  const b = minutesOf(end);
  if (a === null || b === null) return null;
  if (a === b) return 0;
  return b > a ? b - a : b + DAY_MIN - a;
}

/** Does `start`→`end` finish on the next calendar day? */
export const endsNextDay = (start: string | null | undefined, end: string | null | undefined): boolean => {
  const a = minutesOf(start);
  const b = minutesOf(end);
  return a !== null && b !== null && b < a;
};

/**
 * The classic slip: "9 to 5" typed as 09:00 → 05:00 is a 20-hour overnight
 * shift. When an overnight range is implausibly long and moving the end by
 * twelve hours gives a same-day shift, return that end as a suggestion.
 */
export function suggestEnd(start: string | null | undefined, end: string | null | undefined): string | null {
  const a = minutesOf(start);
  const b = minutesOf(end);
  if (a === null || b === null || b >= a) return null;
  const span = b + DAY_MIN - a;
  if (span <= 14 * 60) return null;
  const alt = b + 12 * 60;
  return alt < DAY_MIN && alt > a ? hhmmOf(alt) : null;
}

/** Quick-pick slots every `step` minutes across the day, as `HH:MM`. */
export const slots = (step = 15): string[] =>
  Array.from({ length: Math.ceil(DAY_MIN / step) }, (_, i) => hhmmOf(i * step));

/** The slot nearest to `minutes` (for scrolling the list near "now" or the value). */
export const nearestSlot = (minutes: number, step = 15): string => hhmmOf(Math.round(minutes / step) * step);

/**
 * A duration for reading: `45 min`, `8 h`, `8 h 30 min`; in Arabic
 * `45 د`, `8 س`, `8 س 30 د`. Western digits.
 */
export function formatSpan(minutes: number, lang: Lang = "en"): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const H = lang === "ar" ? "س" : "h";
  const M = lang === "ar" ? "د" : "min";
  if (h === 0) return `${m} ${M}`;
  if (m === 0) return `${h} ${H}`;
  return `${h} ${H} ${m} ${M}`;
}
