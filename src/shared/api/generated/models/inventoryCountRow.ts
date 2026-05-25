/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface InventoryCountRow {
  actual_stock: number;
  branch_inventory_id: string;
  discrepancy: number;
  expected_stock: number;
  ingredient_name: string;
  is_suspicious: boolean;
  /** @nullable */
  note?: string | null;
  unit: string;
}
