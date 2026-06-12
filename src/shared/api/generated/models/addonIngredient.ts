/* eslint-disable */
// @ts-nocheck

export interface AddonIngredient {
  addon_item_id: string;
  id: string;
  ingredient_name: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
  unit: string;
}
