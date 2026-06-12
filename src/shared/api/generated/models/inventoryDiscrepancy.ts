/* eslint-disable */
// @ts-nocheck

export interface InventoryDiscrepancy {
  /** @nullable */
  actual_count?: number | null;
  branch_inventory_id: string;
  /** @nullable */
  discrepancy?: number | null;
  expected_stock: number;
  ingredient_name: string;
  /** @nullable */
  note?: string | null;
  unit: string;
}
