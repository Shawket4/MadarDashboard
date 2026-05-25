/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface AddToStockRequest {
  /** @nullable */
  current_stock?: number | null;
  org_ingredient_id: string;
  /** @nullable */
  reorder_threshold?: number | null;
}
