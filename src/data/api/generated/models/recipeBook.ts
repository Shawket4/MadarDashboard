/* eslint-disable */
// @ts-nocheck
import type { RecipeBookCategory } from './recipeBookCategory';
import type { RecipeCard } from './recipeCard';

/**
 * `GET /recipes/book`.
 */
export interface RecipeBook {
  /** The categories the items sit in, in menu order. */
  categories: RecipeBookCategory[];
  /**
     * Menu order: by category (display order, then name; uncategorised
     * last), then by item name.
     */
  items: RecipeCard[];
}
