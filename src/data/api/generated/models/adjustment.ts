/* eslint-disable */
// @ts-nocheck
import type { AdjustmentReasonVars } from './adjustmentReasonVars';

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
  /**
     * A rule-made line's reason as a code and its figures (`late`
     * `{minutes}`, `absent_no_punch`, …), the payslip breakdown's own, so a
     * client words it in its language (AT-13, E2E B-PAY-4). Null for a
     * bonus and for a manual line (its `reason` is what was typed).
     * @nullable
     */
  reason_code?: string | null;
  /** @nullable */
  reason_vars?: AdjustmentReasonVars;
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
