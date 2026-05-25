/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface BranchInventoryItem {
  below_reorder: boolean;
  branch_id: string;
  cost_per_unit: number;
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
