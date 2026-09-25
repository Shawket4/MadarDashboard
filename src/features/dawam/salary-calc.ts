/**
 * The quick salary calculator (owner decision 9): type any one of a monthly
 * salary, a day rate or an hourly rate and see the other two, from the rules'
 * working days per month and day length (RU-6: day rate = monthly ÷ working
 * days; minute rate = day rate ÷ the day's minutes). Also the first pay of
 * someone who joins mid-period, pro rata by calendar days (PAY-13), the
 * backend's joiner rule. Money is integer piastres; every figure multiplies
 * before it divides and rounds half away from zero.
 */

/** How a salary divides: working days a month (may be a half) and a working day's minutes. */
export interface PayBasis {
  workingDays: number;
  dayMinutes: number;
}

/** 26 working days of 8 hours, unless the rules say otherwise. */
export const DEFAULT_BASIS: PayBasis = { workingDays: 26, dayMinutes: 480 };

/** Integer division rounding half away from zero (b > 0). */
export function roundDiv(a: number, b: number): number {
  const sign = a < 0 ? -1 : 1;
  const abs = Math.abs(a);
  const q = Math.floor(abs / b);
  const r = abs - q * b;
  return sign * (2 * r >= b ? q + 1 : q);
}

/** Working days in hundredths, so a half day stays an integer. */
const daysX100 = (b: PayBasis) => Math.round(b.workingDays * 100);

export interface Rates {
  monthly: number;
  daily: number;
  hourly: number;
}

/** The three rates from whichever one was typed (piastres). */
export function rates(from: { monthly: number } | { daily: number } | { hourly: number }, basis: PayBasis): Rates {
  const d100 = daysX100(basis);
  const mins = basis.dayMinutes;
  if ("monthly" in from) {
    const m = from.monthly;
    return { monthly: m, daily: roundDiv(m * 100, d100), hourly: roundDiv(m * 100 * 60, d100 * mins) };
  }
  if ("daily" in from) {
    const d = from.daily;
    return { monthly: roundDiv(d * d100, 100), daily: d, hourly: roundDiv(d * 60, mins) };
  }
  const h = from.hourly;
  return { monthly: roundDiv(h * mins * d100, 60 * 100), daily: roundDiv(h * mins, 60), hourly: h };
}

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** The pay period holding `date`, for periods opening on `startDay` (PAY-1: the 26th means 26th–25th). */
export function periodOf(date: string, startDay: number): { start: string; end: string; days: number } {
  const [y, m, d] = date.split("-").map(Number);
  const month = d >= startDay ? m - 1 : m - 2; // 0-based month the period opens in
  const start = iso(y, month, startDay);
  const end = iso(y, month + 1, startDay - 1);
  return { start, end, days: dayDiff(start, end) + 1 };
}

/** What someone hired on `hireDate` earns in their first period: the monthly salary × days employed ÷ the period's days. */
export function firstPay(
  monthly: number,
  hireDate: string,
  startDay: number,
): { from: string; to: string; days: number; periodDays: number; piastres: number } {
  const p = periodOf(hireDate, startDay);
  const days = dayDiff(hireDate, p.end) + 1;
  return { from: hireDate, to: p.end, days, periodDays: p.days, piastres: roundDiv(monthly * days, p.days) };
}
