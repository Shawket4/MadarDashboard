/* eslint-disable */
// @ts-nocheck

export interface RecipeLineInput {
  ingredient_id: string;
  /** Submitted quantity (in `unit`); server normalizes to the ingredient base unit. */
  quantity: number;
  unit: string;
}
