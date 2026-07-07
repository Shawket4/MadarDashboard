/* eslint-disable */
// @ts-nocheck

/**
 * Per-waiter sales split. Only waiter-attributed orders appear (dine-in
 * settled from a waiter's ticket — `orders.waiter_id IS NOT NULL`); direct
 * teller sales and delivery orders are out of scope, so totals here are a
 * subset of the branch overview. `attributed_orders`/`attributed_revenue`
 * on the report envelope let the UI caption that gap.
 */
export interface WaiterStats {
  /** line_items / orders; 0 when the waiter has no non-voided orders. */
  avg_items_per_order: number;
  avg_order_value: number;
  /**
     * Units sold (SUM of order_items.quantity) on this waiter's non-voided
     * orders — the upsell signal behind avg_items_per_order.
     */
  line_items: number;
  orders: number;
  revenue: number;
  voided: number;
  waiter_id: string;
  waiter_name: string;
}
