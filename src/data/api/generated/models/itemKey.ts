/* eslint-disable */
// @ts-nocheck

/**
 * One sellable SKU: a (menu_item_id, size_label) pair.
 * `size_label = "one_size"` for items without sizes.
 */
export interface ItemKey {
  menu_item_id: string;
  size_label: string;
}
