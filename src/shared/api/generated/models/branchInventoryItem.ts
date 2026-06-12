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
  org_ingredient_id: string;
  reorder_threshold: number;
  unit: string;
  updated_at: string;
}
