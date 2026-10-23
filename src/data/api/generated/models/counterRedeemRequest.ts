/* eslint-disable */
// @ts-nocheck

export interface CounterRedeemRequest {
  branch_id: string;
  customer_id: string;
  /** One per attempt, made by the page (a UUID). */
  idempotency_key: string;
  /**
     * The stamp track (1–4) to complete; absent = track 1.
     * @minimum 0
     * @nullable
     */
  track?: number | null;
}
