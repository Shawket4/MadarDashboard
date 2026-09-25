/* eslint-disable */
// @ts-nocheck

export interface NewAdjustment {
  /** @nullable */
  amount_piastres?: number | null;
  /**
     * The month it lands in (AD-1): any day of that month; the first month
     * of a recurring line (AD-3). Defaults to today, or, when today's month
     * is already approved, the first day of the next open month (M27).
     * Given explicitly, it must be in an open month (409 PERIOD_CLOSED).
     * @nullable
     */
  effective_date?: string | null;
  employee_id: string;
  /** `bonus` · `deduction` */
  kind: string;
  /**
     * A bonus may be a % of salary.
     * @nullable
     */
  percent_of_base?: number | null;
  reason: string;
  /** Every month until stopped (AD-3). */
  recurring?: boolean;
}
