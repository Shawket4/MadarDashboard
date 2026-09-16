/* eslint-disable */
// @ts-nocheck

/**
 * A line as submitted: quantity in `unit`, normalized to the ingredient's base unit
 * (and grossed up by yield) exactly like a size recipe line.
 */
export interface RecipeBaseLineInput {
  ingredient_id: string;
  quantity: number;
  /** @nullable */
  size_label?: string | null;
  /** @nullable */
  sort?: number | null;
  unit: string;
}
