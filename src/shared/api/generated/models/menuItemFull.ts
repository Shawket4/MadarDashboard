/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { AddonSlot } from './addonSlot';
import type { ItemSize } from './itemSize';
import type { MenuItem } from './menuItem';
import type { MenuItemRecipe } from './menuItemRecipe';
import type { OptionalField } from './optionalField';

export type MenuItemFull = MenuItem & {
  addon_slots: AddonSlot[];
  optional_fields: OptionalField[];
  recipes: MenuItemRecipe[];
  sizes: ItemSize[];
};
