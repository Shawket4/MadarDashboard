/* eslint-disable */
// @ts-nocheck

export interface Adjustment {
  /** @nullable */
  amount_piastres?: number | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  /** The month it lands in (the first day of a recurring line, AD-1/AD-3). */
  effective_date: string;
  employee_id: string;
  employee_name: string;
  /** @nullable */
  ends_on?: string | null;
  id: string;
  /** `bonus` · `deduction` */
  kind: string;
  /** @nullable */
  original_amount_piastres?: number | null;
  /** @nullable */
  overridden_at?: string | null;
  /** @nullable */
  percent_of_base?: number | null;
  reason: string;
  recurring: boolean;
  source: string;
  /** `pending` (waits for the owner) · `approved` · `rejected` */
  status: string;
  /** @nullable */
  stop_reason?: string | null;
  /** @nullable */
  stopped_at?: string | null;
  /**
     * A percent line valued against the salary, in piastres — the server's
     * figure (AT-3); equals `amount_piastres` for a flat line.
     */
  value_piastres: number;
  /**
     * A rule-made deduction the manager forgave: shown, counted for nothing (AD-6/AD-8).
     * @nullable
     */
  waived_at?: string | null;
}
