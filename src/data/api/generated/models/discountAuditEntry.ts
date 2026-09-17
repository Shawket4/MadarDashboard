/* eslint-disable */
// @ts-nocheck

/**
 * One discounted sale in the discounts audit.
 */
export interface DiscountAuditEntry {
  amount_minor: number;
  /**
     * Who applied it (the till operator for older sales).
     * @nullable
     */
  applied_by_name?: string | null;
  /** @nullable */
  approval_id?: string | null;
  /** @nullable */
  approved_by_name?: string | null;
  branch_name: string;
  created_at: string;
  /**
     * The sale was replayed with a discount its author was not allowed and
     * no valid manager approval (`authz_replay_flags`).
     */
  flagged: boolean;
  /**
     * `preset` | `manual_amount` | `manual_percent`, or `null` before attribution.
     * @nullable
     */
  kind?: string | null;
  order_id: string;
  /** @nullable */
  order_ref?: string | null;
  /**
     * Basis points, for a percentage.
     * @nullable
     */
  percent_bps?: number | null;
  /** @nullable */
  preset_id?: string | null;
  /** @nullable */
  preset_name?: string | null;
}
