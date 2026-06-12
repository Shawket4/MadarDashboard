/* eslint-disable */
// @ts-nocheck

export interface AddonOverride {
  addon_item_id: string;
  addon_item_name: string;
  /** @nullable */
  combo_addon_item_id?: string | null;
  /** @nullable */
  combo_addon_item_name?: string | null;
  created_at: string;
  id: string;
  ingredient_name: string;
  ingredient_unit: string;
  menu_item_id: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
  /** @nullable */
  replaces_ingredient_name?: string | null;
  /** @nullable */
  replaces_org_ingredient_id?: string | null;
  /** @nullable */
  size_label?: string | null;
  updated_at: string;
}
