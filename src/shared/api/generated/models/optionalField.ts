/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface OptionalField {
  created_at: string;
  display_order: number;
  id: string;
  /** @nullable */
  ingredient_name?: string | null;
  /** @nullable */
  ingredient_unit?: string | null;
  is_active: boolean;
  menu_item_id: string;
  name: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  price: number;
  /** @nullable */
  quantity_used?: number | null;
  /** @nullable */
  size_label?: string | null;
  updated_at: string;
}
