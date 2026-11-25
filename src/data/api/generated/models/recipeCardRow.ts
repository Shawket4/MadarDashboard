/* eslint-disable */
// @ts-nocheck
import type { RecipeCardCell } from './recipeCardCell';

/**
 * One row: an ingredient, where it came from, and a cell per size.
 */
export interface RecipeCardRow {
  /** One per entry of `sizes`, in the same order. */
  cells: RecipeCardCell[];
  ingredient_id: string;
  ingredient_name: string;
  /**
     * `own` (typed on the item), `linked` (the item it follows), `base` (a
     * recipe base) or `rule` (a packaging rule).
     */
  source: string;
  /** The base unit the amounts are in (`g`, `ml`, `pcs`, …). */
  unit: string;
}
