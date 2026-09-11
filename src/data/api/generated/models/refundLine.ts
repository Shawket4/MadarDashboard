/* eslint-disable */
// @ts-nocheck

export interface RefundLine {
  amount: number;
  id: string;
  /**
     * `order_items.item_name`, so a receipt reprint names the dish without a
     * second lookup.
     */
  item_name: string;
  order_item_id: string;
  quantity: number;
  /**
     * Whether the goods came back. Recorded per line; nothing in this module
     * writes it `true` yet (see the module docs on restock).
     */
  restock: boolean;
}
