/* eslint-disable */
// @ts-nocheck

/**
 * One line of a member's history.
 */
export interface LedgerEntry {
  /**
     * Piastres the rule was applied to (earns only).
     * @nullable
     */
  basis_piastres?: number | null;
  branch_id: string;
  /** @nullable */
  branch_name?: string | null;
  created_at: string;
  /** `"points"` or `"visits"` — which balance this row moved. */
  currency: string;
  id: string;
  kind: string;
  /** @nullable */
  note?: string | null;
  /** @nullable */
  order_id?: string | null;
  points: number;
  /** @nullable */
  reward_name?: string | null;
}
