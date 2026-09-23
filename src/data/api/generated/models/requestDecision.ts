/* eslint-disable */
// @ts-nocheck

export interface RequestDecision {
  /**
     * Paid or unpaid. REQUIRED when approving leave (RQ-2). For `excuse` and
     * `early_departure`, omitted falls back to the rule
     * (`excused_time_paid_default`, branch then business, RQ-7).
     * @nullable
     */
  is_paid?: boolean | null;
  /**
     * Required when cancelling someone else's request, or any approved one
     * (AT-7).
     * @nullable
     */
  note?: string | null;
  /** `approved` | `rejected` | `cancelled`. */
  status: string;
}
