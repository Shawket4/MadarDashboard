/* eslint-disable */
// @ts-nocheck

export interface CounterGiftRequest {
  branch_id: string;
  /** The member, as `/loyalty/lookup` resolved them. */
  customer_id: string;
  /**
     * One per attempt, made by the page (a UUID). A retry with the same key
     * claims nothing new.
     */
  idempotency_key: string;
}
