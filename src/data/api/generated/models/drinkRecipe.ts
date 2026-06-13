/* eslint-disable */
// @ts-nocheck

export interface DrinkRecipe {
  id: string;
  ingredient_name: string;
  menu_item_id: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
  size_label: string;
  unit: string;
}
