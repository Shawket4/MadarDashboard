/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface OrderItemOptional {
  field_name: string;
  id: string;
  /** @nullable */
  ingredient_name?: string | null;
  /** @nullable */
  ingredient_unit?: string | null;
  /** @nullable */
  optional_field_id?: string | null;
  order_item_id: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  price: number;
  /** @nullable */
  quantity_deducted?: number | null;
}
