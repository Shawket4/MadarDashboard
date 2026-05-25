/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface StockRow {
  below_reorder: boolean;
  branch_inventory_id: string;
  cost_per_unit: number;
  current_stock: number;
  ingredient_name: string;
  reorder_threshold: number;
  unit: string;
}
