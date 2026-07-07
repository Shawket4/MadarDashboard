/* eslint-disable */
// @ts-nocheck

export interface OrderSummary {
  completed: number;
  /**
     * Total delivery charges (piastres) across completed orders in scope.
     * Lets the dashboard surface delivery revenue separately from item sales.
     */
  delivery_fees?: number;
  /** Count of completed delivery orders. */
  delivery_orders?: number;
  /** Gross revenue (total_amount) of completed delivery orders. */
  delivery_revenue?: number;
  discounts: number;
  in_mall_fees?: number;
  /** In-mall channel: order count / gross revenue / delivery fees. */
  in_mall_orders?: number;
  in_mall_revenue?: number;
  /**
     * Units sold (SUM of order_items.quantity) across completed orders in
     * scope. Counts units, not distinct lines, matching the item-sales
     * reports ("3× burger" contributes 3).
     */
  line_items?: number;
  outside_fees?: number;
  /** Outside channel: order count / gross revenue / delivery fees. */
  outside_orders?: number;
  outside_revenue?: number;
  revenue: number;
  tips: number;
  voided: number;
}
