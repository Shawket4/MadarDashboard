/* eslint-disable */
// @ts-nocheck
import type { MenuDisplayAddonNameTranslations } from './menuDisplayAddonNameTranslations';

/**
 * One add-on of the org's catalogue (milk, coffee, extras), by name.
 */
export interface MenuDisplayAddon {
  addon_item_id: string;
  is_available: boolean;
  name: string;
  name_translations: MenuDisplayAddonNameTranslations;
  /** `milk_type` | `coffee_type` | `extra` | a custom group's type. */
  type: string;
}
