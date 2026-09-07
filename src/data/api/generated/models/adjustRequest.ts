/* eslint-disable */
// @ts-nocheck

export interface AdjustRequest {
  branch_id: string;
  customer_id: string;
  /** @nullable */
  note?: string | null;
  /** Signed. Negative takes points away. */
  points: number;
}
