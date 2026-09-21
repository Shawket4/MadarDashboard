/* eslint-disable */
// @ts-nocheck

/**
 * One item that collects, denormalised for the picker the same way a reward is.
 */
export interface EarningItem {
  /**
     * Menu price in piastres. Shown so an admin picking items can see what
     * they are handing a stamp for.
     */
  base_price: number;
  /** @nullable */
  image_url?: string | null;
  menu_item_id: string;
  name: string;
  sort_order: number;
}
