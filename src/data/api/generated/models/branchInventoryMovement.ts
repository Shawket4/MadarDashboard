/* eslint-disable */
// @ts-nocheck

export interface BranchInventoryMovement {
  /** @nullable */
  balance_after?: number | null;
  below_zero: boolean;
  branch_id: string;
  /** @nullable */
  branch_inventory_id?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  /** @nullable */
  created_by_name?: string | null;
  id: string;
  ingredient_name: string;
  /** inventory_movement_type: sale | void_restock | adjustment_add |
   * adjustment_remove | waste | transfer_out | transfer_in | purchase_in | stock_count */
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
