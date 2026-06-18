/* eslint-disable */
// @ts-nocheck

/**
 * One ingredient to reorder, with the quantity needed to reach its order-up-to
 * level (par_max, else the reorder point).
 */
export interface ReorderLine {
  current_stock: number;
  ingredient_name: string;
  org_ingredient_id: string;
  /** Quantity (in base units) to bring stock up to the order-up-to level. */
  suggested_qty: number;
  unit: string;
}
