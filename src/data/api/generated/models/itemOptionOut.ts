/* eslint-disable */
// @ts-nocheck
import type { RecipeLineOut } from './recipeLineOut';

/**
 * A priced optional — a member of the item's own `Options` group
 * (what `PUT /menu-items/{id}/options` edits).
 */
export interface ItemOptionOut {
  cost_incomplete: boolean;
  /** @nullable */
  cost_piastres?: number | null;
  id: string;
  is_active: boolean;
  name: string;
  price: number;
  recipe: RecipeLineOut[];
}
