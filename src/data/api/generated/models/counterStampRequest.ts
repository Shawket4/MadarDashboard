/* eslint-disable */
// @ts-nocheck

export interface CounterStampRequest {
  branch_id: string;
  /** The member, as `/loyalty/lookup` resolved them. */
  customer_id: string;
  /**
     * One per attempt, made by the page (a UUID). A retry with the same key
     * stamps nothing new.
     */
  idempotency_key: string;
  /**
     * Items bought on this visit, 1 to 50.
     * @minimum 1
     * @maximum 50
     */
  items: number;
  /**
     * The stamp track (1–4); absent = track 1. A track 2–4 stamps `items`
     * stamps (or one with its "per sale" setting).
     * @minimum 0
     * @nullable
     */
  track?: number | null;
}
