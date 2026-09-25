/* eslint-disable */
// @ts-nocheck
import type { SizeSurcharge } from './sizeSurcharge';

/**
 * What a slot allows: exactly one of `menu_item_id` (an item) or
 * `category_id` (every kind=item item of that category).
 */
export interface ComboChoiceWrite {
  /** @nullable */
  category_id?: string | null;
  /**
     * The choice's id, to keep it on an edit; omit for a new choice.
     * @nullable
     */
  id?: string | null;
  /**
     * The size the combo price covers; `null` = the item's cheapest active size.
     * @nullable
     */
  included_size_label?: string | null;
  /** @nullable */
  menu_item_id?: string | null;
  size_surcharges?: SizeSurcharge[];
  sort?: number;
  /** Per pick unit, piastres (C9 "per-choice surcharge"). */
  surcharge?: number;
}
