/* eslint-disable */
// @ts-nocheck
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
  display_order: number;
  id: string;
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  name: string;
  name_translations: MenuItemNameTranslations;
  org_id: string;
  updated_at: string;
}
