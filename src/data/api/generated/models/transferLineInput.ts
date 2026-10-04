/* eslint-disable */
// @ts-nocheck

/**
 * One ingredient and how much of it.
 */
export interface TransferLineInput {
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  /** Greater than 0. */
  quantity: number;
}
