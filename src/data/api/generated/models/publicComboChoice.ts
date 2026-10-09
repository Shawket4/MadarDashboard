/* eslint-disable */
// @ts-nocheck
import type { PublicComboChoiceNameTranslations } from './publicComboChoiceNameTranslations';
import type { PublicComboSize } from './publicComboSize';

/**
 * One concrete item a public combo slot offers (categories expanded to the
 * category's active items), with whether this channel and branch sell it now.
 */
export interface PublicComboChoice {
  /**
     * `false`: the item is not sold on this menu right now (switched off at
     * the branch or on the channel, or inactive). The page shows it greyed
     * with "Unavailable" and never lets it be picked (an order that picks it
     * is refused `COMBO_ITEM_UNAVAILABLE`); it has no `sizes` and is never
     * the slot's default. Absent from an older server: available.
     */
  available?: boolean;
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
