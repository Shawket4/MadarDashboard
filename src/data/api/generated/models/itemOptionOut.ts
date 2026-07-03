/* eslint-disable */
// @ts-nocheck
import type { RecipeLineOut } from './recipeLineOut';

/**
 * A priced optional — a member of the item-private `Options` group
 * (a modifier_group with `legacy_addon_type IS NULL` owned by this item).
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
