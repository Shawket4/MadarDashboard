/* eslint-disable */
// @ts-nocheck
import type { OrderItemOptionalNameTranslations } from './orderItemOptionalNameTranslations';

export interface OrderItemOptional {
  /**
     * Ingredient cost per parent-item unit in piastres. `null` ⟺ unknown or
     * no ingredient linked.
     * @nullable
     */
  cost?: number | null;
  field_name: string;
  id: string;
  /** @nullable */
  ingredient_name?: string | null;
  /** @nullable */
  ingredient_unit?: string | null;
  name_translations: OrderItemOptionalNameTranslations;
  /** @nullable */
  optional_field_id?: string | null;
  order_item_id: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  price: number;
  /** @nullable */
  quantity_deducted?: number | null;
}
