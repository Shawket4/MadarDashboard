/* eslint-disable */
// @ts-nocheck

export interface StockRow {
  below_reorder: boolean;
  branch_inventory_id: string;
  /**
     * Piastres per unit; `null` ⟺ cost never entered.
     * @nullable
     */
  cost_per_unit?: number | null;
  current_stock: number;
  ingredient_name: string;
  reorder_threshold: number;
  unit: string;
}
