/* eslint-disable */
// @ts-nocheck
import type { MenuDisplayComboChoiceNameTranslations } from './menuDisplayComboChoiceNameTranslations';
import type { MenuDisplaySize } from './menuDisplaySize';

/**
 * One item a combo slot offers. Unavailable choices are left out.
 */
export interface MenuDisplayComboChoice {
  /** @nullable */
  image_url?: string | null;
  included_size_label: string;
  menu_item_id: string;
  name: string;
  name_translations: MenuDisplayComboChoiceNameTranslations;
  /** In the order the priced menu offers them (cheapest first). */
  sizes: MenuDisplaySize[];
}
