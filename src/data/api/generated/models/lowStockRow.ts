/* eslint-disable */
// @ts-nocheck

export interface LowStockRow {
  branch_id: string;
  branch_name: string;
  ingredient_name: string;
  on_hand: number;
  org_ingredient_id: string;
  /**
     * Order-up-to level; `null` when only a reorder point is set.
     * @nullable
     */
  par_max?: number | null;
  /** Reorder point the item is at or below. */
  par_min: number;
  /** Quantity to bring stock back to par_max (or par_min when no max is set). */
  suggested_qty: number;
  /**
     * Default supplier for this ingredient (for one-click "create PO"); may be null.
     * @nullable
     */
  supplier_id?: string | null;
  /** @nullable */
  supplier_name?: string | null;
  unit: string;
}
