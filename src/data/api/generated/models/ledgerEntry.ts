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
  /**
     * `earn`, `redeem`, `adjust`, or `reverse_earn` / `reverse_redeem` /
     * `reverse_adjust` — the last three undo the row named in `reverses_id`.
     */
  kind: string;
  /** @nullable */
  note?: string | null;
  /** @nullable */
  order_id?: string | null;
  points: number;
  /**
     * For a reversal, the row it undoes.
     * @nullable
     */
  reverses_id?: string | null;
  /** @nullable */
  reward_name?: string | null;
  /**
     * Why the row exists: `sale`, `redemption`, `void`, `refund`, `birthday`,
     * `winback` or `manual`. What a till or a dashboard should print as the
     * reason, instead of guessing from the kind and the note.
     */
  source: string;
}
