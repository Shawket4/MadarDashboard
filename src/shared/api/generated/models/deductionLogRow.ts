/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface DeductionLogRow {
  created_at: string;
  id: string;
  inventory_item_id: string;
  item_name: string;
  /** @nullable */
  order_id?: string | null;
  /** @nullable */
  order_item_id?: string | null;
  quantity_deducted: number;
  source: string;
  unit: string;
}
