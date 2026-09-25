/* eslint-disable */
// @ts-nocheck
import type { PublicComboChoiceNameTranslations } from './publicComboChoiceNameTranslations';
import type { PublicComboSize } from './publicComboSize';

/**
 * One concrete item a public combo slot offers (categories expanded to the
 * items available on this channel and branch).
 */
export interface PublicComboChoice {
  /** The included size's channel price (what the split weighs it by). */
  base_price: number;
  /** @nullable */
  image_url?: string | null;
  included_size_label: string;
  menu_item_id: string;
  name: string;
  name_translations: PublicComboChoiceNameTranslations;
  sizes: PublicComboSize[];
  /** The choice's own surcharge, per pick unit. */
  surcharge: number;
}
