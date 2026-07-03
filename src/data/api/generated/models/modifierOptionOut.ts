/* eslint-disable */
// @ts-nocheck
import type { RecipeLineOut } from './recipeLineOut';

/**
 * A modifier option inside an attached group.
 */
export interface ModifierOptionOut {
  cost_incomplete: boolean;
  /**
     * Option recipe cost in piastres (swap markers cost 0). `null` = unknown.
     * @nullable
     */
  cost_piastres?: number | null;
  id: string;
  /** `false` = the group offers this option but it is not enabled on this item
   * (item's `included_option_ids` allowlist excludes it). */
  included: boolean;
  is_active: boolean;
  is_default: boolean;
  name: string;
  price: number;
  recipe: RecipeLineOut[];
  /** @nullable */
  replaces_ingredient_id?: string | null;
}
