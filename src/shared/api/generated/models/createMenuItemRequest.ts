/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface CreateMenuItemRequest {
  base_price: number;
  category_id: string;
  /** @nullable */
  description?: string | null;
  /** @nullable */
  display_order?: number | null;
  /** @nullable */
  image_url?: string | null;
  name: string;
  org_id: string;
}
