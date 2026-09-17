/* eslint-disable */
// @ts-nocheck

export interface TimeseriesPoint {
  /** SUM(order_item_addons.quantity) across non-voided orders in this period. */
  addons: number;
  discount: number;
  /** SUM(order_items.quantity) across non-voided orders in this period. */
  line_items: number;
  orders: number;
  period: string;
  refunded?: number;
  /** Net of refunds against the period's sales; `refunded` is what came off. */
  revenue: number;
  revenue_by_method: unknown;
  tax: number;
  voided: number;
}
