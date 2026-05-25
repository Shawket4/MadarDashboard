/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface OrderItem {
  /** @nullable */
  bundle_id?: string | null;
  /** @nullable */
  bundle_unit_price?: number | null;
  deductions_snapshot: unknown;
  id: string;
  item_name: string;
  line_total: number;
  /** @nullable */
  menu_item_id?: string | null;
  /** @nullable */
  notes?: string | null;
  order_id: string;
  quantity: number;
  /** @nullable */
  size_label?: string | null;
  unit_price: number;
}
