/* eslint-disable */
// @ts-nocheck

export interface LowStockRow {
  branch_id: string;
  branch_name: string;
  current_stock: number;
  /** reorder_threshold − current_stock: how much to order to reach par. */
  deficit: number;
  ingredient_name: string;
  org_ingredient_id: string;
  reorder_threshold: number;
  /**
     * Default supplier for this ingredient (for one-click "create PO"); may be null.
     * @nullable
     */
  supplier_id?: string | null;
  /** @nullable */
  supplier_name?: string | null;
  unit: string;
}
