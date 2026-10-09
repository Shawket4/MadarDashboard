/* eslint-disable */
// @ts-nocheck
import type { ComboChoiceNameTranslations } from './comboChoiceNameTranslations';
import type { SizeSurcharge } from './sizeSurcharge';

/**
 * A choice as stored, with its target's display name.
 */
export interface ComboChoice {
  /** @nullable */
  category_id?: string | null;
  id: string;
  /** @nullable */
  included_size_label?: string | null;
  /** @nullable */
  menu_item_id?: string | null;
  /** The item's or the category's name (display only). */
  name?: string;
  name_translations?: ComboChoiceNameTranslations;
  size_surcharges: SizeSurcharge[];
  sort: number;
  surcharge: number;
}
