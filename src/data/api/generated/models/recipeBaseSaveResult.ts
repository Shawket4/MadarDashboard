/* eslint-disable */
// @ts-nocheck
import type { RecipeBaseOut } from './recipeBaseOut';

/**
 * Result of any write that re-expanded recipes.
 */
export interface RecipeBaseSaveResult {
  base: RecipeBaseOut;
  catalog_revision: number;
  /** Sizes (incl. linked copies) whose stored lines changed. */
  sizes_changed: number;
}
