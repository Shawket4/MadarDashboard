/* eslint-disable */
// @ts-nocheck
import type { AssetGroupRef } from './assetGroupRef';
import type { MenuItemDescriptionTranslations } from './menuItemDescriptionTranslations';
import type { MenuItemNameTranslations } from './menuItemNameTranslations';

export interface MenuItem {
  base_price: number;
  /** @nullable */
  category_id?: string | null;
  created_at: string;
  /** @nullable */
  default_milk_addon_id?: string | null;
  /** @nullable */
  deleted_at?: string | null;
  /** @nullable */
  description?: string | null;
  description_translations: MenuItemDescriptionTranslations;
  id: string;
  image?: null | AssetGroupRef;
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  /**
     * `item` | `combo` (combos module). A combo's price is its `one_size`
     * row like any item; its slots are on `GET /combos/{id}`. Additive.
     */
  kind?: string;
  name: string;
  name_translations: MenuItemNameTranslations;
  org_id: string;
  updated_at: string;
}
