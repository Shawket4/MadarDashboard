/* eslint-disable */
// @ts-nocheck
import type { RecipeLineOut } from './recipeLineOut';

/**
 * Result of a recipe replace: the recomputed size cost.
 */
export interface RecipeCostResult {
  catalog_revision: number;
  cost_incomplete: boolean;
  /** @nullable */
  cost_piastres?: number | null;
  recipe: RecipeLineOut[];
  size_id: string;
}
