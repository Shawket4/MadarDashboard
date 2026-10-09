/* eslint-disable */
// @ts-nocheck

export interface ReviewAdvance {
  /**
     * Approve a different amount than asked.
     * @nullable
     */
  amount_piastres?: number | null;
  approve: boolean;
  /** @nullable */
  installments?: number | null;
  /**
     * Why (kept as the decision note). Required to reject: `note` or
     * `reason`, `reason` wins (400 `REASON_REQUIRED`, D8).
     * @nullable
     */
  note?: string | null;
  /** @nullable */
  reason?: string | null;
}
