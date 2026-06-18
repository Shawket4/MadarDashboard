/* eslint-disable */
// @ts-nocheck

export interface AddToStockRequest {
  /** @nullable */
  current_stock?: number | null;
  org_ingredient_id: string;
  /** @nullable */
  par_max?: number | null;
  /** @nullable */
  par_min?: number | null;
  /** @nullable */
  reorder_threshold?: number | null;
}
