/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface MenuItem {
  base_price: number;
  /** @nullable */
  category_id?: string | null;
  created_at: string;
  /** @nullable */
  default_milk_addon_id?: string | null;
  /** @nullable */
  deleted_at?: string | null;
  /** @nullable */
  description?: string | null;
  display_order: number;
  id: string;
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  name: string;
  org_id: string;
  updated_at: string;
}
