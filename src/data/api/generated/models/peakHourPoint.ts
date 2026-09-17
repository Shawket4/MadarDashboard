/* eslint-disable */
// @ts-nocheck

export interface PeakHourPoint {
  /** SUM(order_item_addons.quantity) across non-voided orders in this hour bucket. */
  addons: number;
  /** Orders averaged over the number of calendar days (may be fractional). */
  avg_orders_per_day: number;
  /** Revenue in piastres averaged over the number of calendar days in the queried range. */
  avg_revenue_per_day: number;
  discount: number;
  hour: number;
  /** SUM(order_items.quantity) across non-voided orders in this hour bucket. */
  line_items: number;
  orders: number;
  /** This hour's orders as a percentage of the period total (0–100, 1 dp). */
  orders_pct: number;
  revenue: number;
  /** This hour's revenue as a percentage of the period total (0–100, 1 dp). */
  revenue_pct: number;
  tax: number;
  voided: number;
}
