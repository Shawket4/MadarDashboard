/* eslint-disable */
// @ts-nocheck

export interface CreateAdjustmentRequest {
  /**
     * Exactly one of `amount_piastres` or `percent_of_base`.
     * @nullable
     */
  amount_piastres?: number | null;
  effective_date: string;
  /** @nullable */
  percent_of_base?: number | null;
  reason: string;
  user_id: string;
}
