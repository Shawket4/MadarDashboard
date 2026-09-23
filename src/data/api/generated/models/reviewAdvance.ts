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
  /** @nullable */
  note?: string | null;
}
