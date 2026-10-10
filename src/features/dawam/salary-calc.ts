/**
 * The quick salary calculator (owner decision 9): type any one of a monthly
 * salary, a day rate or an hourly rate and see the other two, from the rules'
 * working days per month and day length (RU-6: day rate = monthly ÷ working
 * days; minute rate = day rate ÷ the day's minutes). Also the first pay of
 * someone who joins mid-period, pro rata by calendar days (PAY-13), the
 * backend's joiner rule. Both are madar-dawam's Rust through WebAssembly
 * (`@/lib/rules`), the server's own arithmetic; salary-calc.test.ts runs them
 * against the pinned salary_vectors.json.
 */
import { rules, type SalaryRates, type TypedRate } from "@/lib/rules";

/** How a salary divides: working days a month (may be a half) and a working day's minutes. */
export interface PayBasis {
  workingDays: number;
  dayMinutes: number;
}

/** 26 working days of 8 hours, unless the rules say otherwise. */
export const DEFAULT_BASIS: PayBasis = { workingDays: 26, dayMinutes: 480 };

export type { SalaryRates as Rates } from "@/lib/rules";

/** The three rates from whichever one was typed (piastres): madar-dawam `salary::rates`. */
export const rates = (from: TypedRate, basis: PayBasis): SalaryRates => rules.rates(from, basis.workingDays, basis.dayMinutes);

/** The pay period holding `date`, for periods opening on `startDay` (PAY-1: the 26th means 26th–25th).
 *  madar-dawam `pay::period_window` (WebAssembly), pinned by src/lib/dawam_vectors.json: `startDay` clamps to 1–28. */
export function periodOf(date: string, startDay: number): { start: string; end: string; days: number } {
  const [start, end] = rules.pay_period(date, startDay);
  return { start, end, days: rules.first_pay(0, start, startDay).period_days };
}

/** What someone hired on `hireDate` earns in their first period (madar-dawam `salary::first_pay`): the monthly salary × days employed ÷ the period's days. */
export function firstPay(
  monthly: number,
  hireDate: string,
  startDay: number,
): { from: string; to: string; days: number; periodDays: number; piastres: number } {
  const { period_days: periodDays, ...rest } = rules.first_pay(monthly, hireDate, startDay);
  return { ...rest, periodDays };
}
