/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface CreateAddonItemRequest {
  addon_type: string;
  default_price: number;
  /** @nullable */
  display_order?: number | null;
  name: string;
  org_id: string;
}
