/* eslint-disable */
// @ts-nocheck

/**
 * One recipe line as submitted to the option-recipe replace endpoint. `quantity`
 * may be 0 (a swap marker). Server normalizes to the ingredient base unit.
 */
export interface OptionRecipeLineInput {
  ingredient_id: string;
  quantity: number;
  unit: string;
}
