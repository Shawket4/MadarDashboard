/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface UpsertAddonOverrideRequest {
  addon_item_id: string;
  /** @nullable */
  combo_addon_item_id?: string | null;
  ingredient_name: string;
  ingredient_unit: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
  /** @nullable */
  replaces_org_ingredient_id?: string | null;
  /** @nullable */
  size_label?: string | null;
}
