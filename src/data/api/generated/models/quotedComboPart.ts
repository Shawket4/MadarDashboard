/* eslint-disable */
// @ts-nocheck

/**
 * One part of a quoted combo line.
 */
export interface QuotedComboPart {
  /** Its add-ons and optional fields, whole line. */
  addons_total: number;
  combo_share: number;
  combo_surcharge: number;
  /** `combo_share + combo_surcharge`. */
  line_total: number;
  menu_item_id: string;
  quantity: number;
  size_label: string;
  slot_id: string;
  /** The item's normal price at this size. */
  unit_price: number;
}
