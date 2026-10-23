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
  /**
     * Who wrote the row: the teller who applied a reward or rang the sale, the
     * admin who adjusted by hand. `None` for the system (birthday, win-back,
     * a trigger with no actor).
     * @nullable
     */
  created_by?: string | null;
  /** @nullable */
  created_by_name?: string | null;
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
     * `winback`, `manual`, `merge` or `counter` (no order: the Rewards teller page). What a till or a dashboard should print as the
     * reason, instead of guessing from the kind and the note.
     */
  source: string;
  /**
     * The stamp track this row moved (2–4); absent for track 1.
     * @nullable
     */
  track?: number | null;
}
