/* eslint-disable */
// @ts-nocheck

export interface NewAdjustment {
  /** @nullable */
  amount_piastres?: number | null;
  /** @nullable */
  effective_date?: string | null;
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
  user_id: string;
}
