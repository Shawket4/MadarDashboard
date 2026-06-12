/* eslint-disable */
// @ts-nocheck

/**
 * One derived setup step.
 */
export interface OnboardingStep {
  /** Supporting count (branches created, items added, …). */
  count: number;
  /** True when the underlying data exists. */
  done: boolean;
  /** Stable key the dashboard switches on — never localized. */
  key: string;
  /** Steps that are encouraged but not blocking (`required = false`
   * never gates `can_complete`). */
  required: boolean;
}
