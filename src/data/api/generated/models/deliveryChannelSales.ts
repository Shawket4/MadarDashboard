/* eslint-disable */
// @ts-nocheck

/**
 * Delivery sales for one delivery channel. Revenue and order counts are over
 * **delivered** orders only; `cancelled_orders` is shown separately so the UI
 * can surface drop-off without inflating revenue.
 *
 * Read from `delivery_orders` — the quote — not from `orders`: a delivery that
 * never settled into a sale still tells the shop something about its
 * channels. Refunds are against the sale and are not netted here.
 */
export interface DeliveryChannelSales {
  avg_order_value: number;
  cancelled_orders: number;
  /** Delivery channel: `in_mall`, `outside`, `umbrella` or `pickup`. */
  channel: string;
  /**
     * Sum of `delivery_fee` (piastres) over delivered orders. Outside the tax
     * base and not food revenue; a pickup carries none.
     */
  delivery_fees: number;
  /**
     * `revenue − delivery_fees`: the bill for the goods (tax included), the
     * figure comparable with dine-in and takeaway revenue.
     */
  goods_revenue?: number;
  orders: number;
  /**
     * Sum of `total` (piastres) over delivered orders on this channel — the
     * whole bill, delivery fee included.
     */
  revenue: number;
}
