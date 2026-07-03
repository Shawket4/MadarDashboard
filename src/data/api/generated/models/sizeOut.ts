/* eslint-disable */
// @ts-nocheck
import type { RecipeLineOut } from './recipeLineOut';

/**
 * A size (menu_item_sizes row) with its recipe and live cost.
 */
export interface SizeOut {
  /** `true` when at least one recipe line is unlinked/uncosted (so `cost_piastres`, if
   * present, is a partial figure rather than the full COGS). */
  cost_incomplete: boolean;
  /**
     * Recipe cost rollup in piastres over the priced ingredients. `null` when there is
   * no recipe or nothing is priced; a partial rollup returns the sum-so-far with
   * `cost_incomplete = true`.
     * @nullable
     */
  cost_piastres?: number | null;
  id: string;
  is_active: boolean;
  label: string;
  price: number;
  recipe: RecipeLineOut[];
  sort: number;
}
