/* eslint-disable */
// @ts-nocheck

export interface StockMovement {
  balance_after: number;
  below_zero: boolean;
  branch_id: string;
  /**
     * Branch name; only populated by the all-branches waste roll-up (nil
     * {branch_id}). `None` for single-branch queries that do not select it.
     * @nullable
     */
  branch_name?: string | null;
  /** @nullable */
  branch_stock_id?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  /** @nullable */
  created_by_name?: string | null;
  id: string;
  ingredient_name: string;
  /**
     * inventory_movement_type: sale | void_restock | adjustment_add |
     * adjustment_remove | waste | transfer_out | transfer_in | purchase_in |
     * purchase_return | stock_count
     */
  movement_type: string;
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  /** Signed delta applied to stock (consumption negative, replenishment positive). */
  quantity: number;
  /** @nullable */
  reason?: string | null;
  /** @nullable */
  source_id?: string | null;
  /** @nullable */
  source_type?: string | null;
  unit: string;
  /**
     * Piastres per unit at movement time; `null` ⟺ unknown.
     * @nullable
     */
  unit_cost?: number | null;
}
