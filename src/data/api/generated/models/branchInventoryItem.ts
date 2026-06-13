/* eslint-disable */
// @ts-nocheck

export interface BranchInventoryItem {
  below_reorder: boolean;
  branch_id: string;
  /**
     * Piastres per unit; `null` ⟺ cost never entered.
     * @nullable
     */
  cost_per_unit?: number | null;
  created_at: string;
  current_stock: number;
  /** @nullable */
  description?: string | null;
  id: string;
  ingredient_name: string;
  /**
     * When this item was last reconciled by a finalized stock count; `null` =
   * never counted. Drives the "count due" signal on the inventory home.
     * @nullable
     */
  last_counted_at?: string | null;
  org_ingredient_id: string;
  reorder_threshold: number;
  unit: string;
  updated_at: string;
}
