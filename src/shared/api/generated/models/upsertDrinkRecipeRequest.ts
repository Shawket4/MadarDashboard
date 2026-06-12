/* eslint-disable */
// @ts-nocheck

export interface UpsertDrinkRecipeRequest {
  ingredient_name: string;
  ingredient_unit: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
  size_label: string;
}
