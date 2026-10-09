/* eslint-disable */
// @ts-nocheck

/**
 * `GET /reports/orgs/{org}/transfer-differences`: one received line whose
 * received quantity differs from what was sent.
 */
export interface TransferDifferenceRow {
  destination_branch_name: string;
  /** received − sent; negative = transit loss. */
  difference: number;
  ingredient_name: string;
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  qty_received: number;
  qty_sent: number;
  received_at: string;
  reference: string;
  source_branch_name: string;
  transfer_id: string;
  unit: string;
  /** @nullable */
  unit_cost?: number | null;
  /**
     * `difference × unit_cost`, piastres; `None` when the cost is unknown.
     * @nullable
     */
  value_difference?: number | null;
}
