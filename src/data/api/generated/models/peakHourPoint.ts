/* eslint-disable */
// @ts-nocheck

export interface PeakHourPoint {
  /** Orders averaged over the number of calendar days (may be fractional). */
  avg_orders_per_day: number;
  /** Revenue in piastres averaged over the number of calendar days in the queried range. */
  avg_revenue_per_day: number;
  discount: number;
  hour: number;
  orders: number;
  /** This hour's orders as a percentage of the period total (0–100, 1 dp). */
  orders_pct: number;
  revenue: number;
  /** This hour's revenue as a percentage of the period total (0–100, 1 dp). */
  revenue_pct: number;
  tax: number;
  voided: number;
}
