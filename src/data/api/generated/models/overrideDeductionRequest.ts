/* eslint-disable */
// @ts-nocheck

export interface OverrideDeductionRequest {
  /**
     * The figure to charge instead of the computed one. Zero is allowed — it
     * means "charge nothing" while keeping the row and its history.
     */
  amount_piastres: number;
  /**
     * Required. An override with no stated reason is indistinguishable from a
     * mistake six months later.
     */
  reason: string;
}
