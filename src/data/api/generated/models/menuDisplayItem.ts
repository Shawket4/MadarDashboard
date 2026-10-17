/* eslint-disable */
// @ts-nocheck
import type { MenuDisplayCombo } from './menuDisplayCombo';
import type { MenuDisplayItemNameTranslations } from './menuDisplayItemNameTranslations';
import type { MenuDisplayModifierGroup } from './menuDisplayModifierGroup';
import type { MenuDisplayOptional } from './menuDisplayOptional';
import type { MenuDisplaySize } from './menuDisplaySize';

export interface MenuDisplayItem {
  /** The item's add-on allowlist (empty = no restriction). */
  allowed_addon_ids: string[];
  /** @nullable */
  category_id?: string | null;
  combo?: null | MenuDisplayCombo;
  /**
     * The item's base milk, pre-selected as on the till.
     * @nullable
     */
  default_milk_addon_id?: string | null;
  /** @nullable */
  description?: string | null;
  id: string;
  /** @nullable */
  image_url?: string | null;
  /** `item` | `combo`. */
  kind: string;
  /** Non-empty = the item's add-ons are exactly these groups' options. */
  modifier_groups: MenuDisplayModifierGroup[];
  name: string;
  name_translations: MenuDisplayItemNameTranslations;
  optionals: MenuDisplayOptional[];
  sizes: MenuDisplaySize[];
}
