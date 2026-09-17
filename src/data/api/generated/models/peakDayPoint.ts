/* eslint-disable */
// @ts-nocheck

export interface PeakDayPoint {
  /** SUM(order_item_addons.quantity) across non-voided orders on this weekday. */
  addons: number;
  /** Orders averaged over how many times this weekday occurred (may be fractional). */
  avg_orders_per_day: number;
  /** Revenue in piastres averaged over how many times this weekday occurred in the queried range. */
  avg_revenue_per_day: number;
  /** Day of week per `EXTRACT(dow ...)`: 0 = Sunday .. 6 = Saturday. */
  day_of_week: number;
  discount: number;
  /** SUM(order_items.quantity) across non-voided orders on this weekday. */
  line_items: number;
  orders: number;
  /** This weekday's orders as a percentage of the period total (0–100, 1 dp). */
  orders_pct: number;
  revenue: number;
  /** This weekday's revenue as a percentage of the period total (0–100, 1 dp). */
  revenue_pct: number;
  tax: number;
  voided: number;
}
