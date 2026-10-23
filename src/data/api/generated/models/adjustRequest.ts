/* eslint-disable */
// @ts-nocheck

export interface AdjustRequest {
  branch_id: string;
  customer_id: string;
  /** @nullable */
  note?: string | null;
  /** Signed. Negative takes points away. */
  points: number;
  /**
     * The stamp track (2–4) to adjust; absent = track 1 (the balance above).
     * @minimum 0
     * @nullable
     */
  track?: number | null;
}
