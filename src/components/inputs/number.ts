import { latinDigits } from "./time";

/**
 * Read a number the way it gets typed in Egypt: Latin or Arabic-Indic digits,
 * `,` or `٬` as thousands, `.` or `٫` as the decimal point. `null` when it
 * isn't a number; empty is `null` too.
 */
export function parseNumber(raw: string): number | null {
  const s = latinDigits(raw)
    .trim()
    .replace(/[\s,٬٬]/g, "")
    .replace(/[٫٫]/g, ".")
    .replace(/^−/, "-");
  if (!s || !/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Round to the step's decimals, so 0.1 + 0.2 reads 0.3. */
export const roundTo = (n: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

export const decimalsOf = (step: number): number => {
  const s = String(step);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
};

/** A number for reading: grouped, Western digits, at most `max` decimals. */
export const fmtFigure = (n: number, min = 0, max = 2): string =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    numberingSystem: "latn",
  }).format(n);
