/* eslint-disable */
// @ts-nocheck
import type { RecipeCardRow } from './recipeCardRow';
import type { RecipeCardSize } from './recipeCardSize';
import type { RecipeCardStep } from './recipeCardStep';

/**
 * An item's recipe, as one table.
 */
export interface RecipeCard {
  /**
     * `null` when the item has no (live) category.
     * @nullable
     */
  category_id?: string | null;
  /**
     * A linked copy: the name of the item whose recipe it follows.
     * @nullable
     */
  follows_item_name?: string | null;
  is_active: boolean;
  menu_item_id: string;
  name: string;
  name_translations: unknown;
  /** Empty when the item has no recipe yet. */
  rows: RecipeCardRow[];
  sizes: RecipeCardSize[];
  steps: RecipeCardStep[];
}
