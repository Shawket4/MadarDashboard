/* eslint-disable */
// @ts-nocheck
import type { AddonSlot } from './addonSlot';
import type { ItemSize } from './itemSize';
import type { MenuItem } from './menuItem';
import type { MenuItemRecipe } from './menuItemRecipe';
import type { OptionalField } from './optionalField';
import type { RecipeStep } from './recipeStep';

export type MenuItemFull = MenuItem & {
  addon_slots: AddonSlot[];
  /** Explicit per-item addon allowlist. Empty = no restriction (use org catalog). */
  allowed_addon_ids: string[];
  optional_fields: OptionalField[];
  /**
     * How the item is made, in order. Each preset step carries its animation's
     * address and fingerprint, so a device downloads only what its own menu
     * uses and never the whole library.
     */
  recipe_steps?: RecipeStep[];
  recipes: MenuItemRecipe[];
  sizes: ItemSize[];
};
