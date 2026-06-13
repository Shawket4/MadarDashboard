/* eslint-disable */
// @ts-nocheck

export interface BranchInventoryAdjustment {
  adjusted_by: string;
  adjusted_by_name: string;
  adjustment_type: string;
  branch_id: string;
  branch_inventory_id: string;
  created_at: string;
  id: string;
  ingredient_name: string;
  note: string;
  quantity: number;
  /** @nullable */
  transfer_id?: string | null;
  unit: string;
}
