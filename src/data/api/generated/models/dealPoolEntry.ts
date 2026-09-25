/* eslint-disable */
// @ts-nocheck

/**
 * An item or a category (every kind=item item of it) a deal counts, at one
 * size or any (`size_label` null).
 */
export interface DealPoolEntry {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  menu_item_id?: string | null;
  /** @nullable */
  size_label?: string | null;
}
