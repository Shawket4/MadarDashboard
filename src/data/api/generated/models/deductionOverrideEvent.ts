/* eslint-disable */
// @ts-nocheck

/**
 * One waive, unwaive or override of a payroll deduction, from the money
 * audit log (D8).
 */
export interface DeductionOverrideEvent {
  /** `waive` · `unwaive` · `override` */
  action: string;
  /** @nullable */
  actor_id?: string | null;
  /** @nullable */
  actor_name?: string | null;
  /** @nullable */
  amount_after_piastres?: number | null;
  /**
     * What the line charged before and after this event (a waiver: after
     * 0; undoing one: before 0).
     * @nullable
     */
  amount_before_piastres?: number | null;
  at: string;
  deduction_id: string;
  /**
     * The line itself: its day, what made it (`absence`, `late_penalty`,
     * …) and its rule's reason code. Null if the line is gone.
     * @nullable
     */
  effective_date?: string | null;
  /** @nullable */
  employee_id?: string | null;
  /** @nullable */
  employee_name?: string | null;
  /** @nullable */
  reason?: string | null;
  /** @nullable */
  reason_code?: string | null;
  /** @nullable */
  source?: string | null;
}
