/* eslint-disable */
// @ts-nocheck
import type { AddonSlot } from './addonSlot';
import type { ComboFeed } from './comboFeed';
import type { ItemSize } from './itemSize';
import type { MealLink } from './mealLink';
import type { MenuItem } from './menuItem';
import type { MenuItemFullPricing } from './menuItemFullPricing';
import type { MenuItemRecipe } from './menuItemRecipe';
import type { OptionalField } from './optionalField';
import type { RecipeStep } from './recipeStep';

export type MenuItemFull = MenuItem & ({
  addon_slots: AddonSlot[];
  /**
     * Every size row, INCLUDING the synthetic `one_size` one. Additive: this is
     * where price actually lives, and it is what the dashboard's size editor
     * and new POS builds read. An item always has at least one entry.
     */
  all_sizes?: ItemSize[];
  /** Explicit per-item addon allowlist. Empty = no restriction (use org catalog). */
  allowed_addon_ids: string[];
  combo?: null | ComboFeed;
  meal?: null | MealLink;
  optional_fields: OptionalField[];
  /**
     * How a sale line of this item is priced at the requested branch:
     * madar-catalog's `ItemView` (sizes with their branch prices, the
     * branch's item price, the recipe's swap bases and their candidates, the
     * optional fields). The till prices with it exactly as the order path
     * does. Present on `?full=true` lists; additive, older tills ignore it.
     * @nullable
     */
  pricing?: MenuItemFullPricing;
  /**
     * How the item is made, in order. Each preset step carries its animation's
     * address and fingerprint, so a device downloads only what its own menu
     * uses and never the whole library.
     */
  recipe_steps?: RecipeStep[];
  recipes: MenuItemRecipe[];
  /**
     * LEGACY SHAPE — unchanged for clients at or below v0.7.11: the synthetic
     * `one_size` row that now carries a single-price item's price is hidden
     * here, so an old till still sees a size-less item exactly as it did.
     */
  sizes: ItemSize[];
});
