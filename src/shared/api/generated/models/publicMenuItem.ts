/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PublicAddonSlot } from './publicAddonSlot';
import type { PublicItemSize } from './publicItemSize';
import type { PublicMenuItemDescriptionTranslations } from './publicMenuItemDescriptionTranslations';
import type { PublicMenuItemNameTranslations } from './publicMenuItemNameTranslations';

export interface PublicMenuItem {
  addon_slots: PublicAddonSlot[];
  base_price: number;
  /** @nullable */
  description?: string | null;
  description_translations: PublicMenuItemDescriptionTranslations;
  display_order: number;
  id: string;
  /** @nullable */
  image_url?: string | null;
  name: string;
  name_translations: PublicMenuItemNameTranslations;
  sizes: PublicItemSize[];
}
