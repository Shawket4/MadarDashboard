/* eslint-disable */
// @ts-nocheck

/**
 * Delivery sales for one delivery channel (`in_mall` / `outside`). Revenue and
 * order counts are over **delivered** orders only; `cancelled_orders` is shown
 * separately so the UI can surface drop-off without inflating revenue.
 */
export interface DeliveryChannelSales {
  avg_order_value: number;
  cancelled_orders: number;
  /** Delivery channel: `in_mall` or `outside`. */
  channel: string;
  /** Sum of `delivery_fee` (piastres) over delivered orders. */
  delivery_fees: number;
  orders: number;
  /** Sum of `total` (piastres) over delivered orders on this channel. */
  revenue: number;
}
