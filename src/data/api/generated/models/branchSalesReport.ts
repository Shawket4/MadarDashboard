/* eslint-disable */
// @ts-nocheck
import type { CategorySales } from './categorySales';
import type { ItemSales } from './itemSales';

export interface BranchSalesReport {
  branch_id: string;
  branch_name: string;
  by_category: CategorySales[];
  /** The cash slice of `total_tips` (snapshotted `tip_is_cash`). */
  cash_tips?: number;
  /** @nullable */
  from?: string | null;
  /**
     * Sales in range as rung up, before any refund. Was what `total_revenue`
     * meant until 2026-09.
     */
  gross_sales?: number;
  /**
     * Money refunded against the sales in range (partial refunds; a fully
     * refunded order is out of every figure here by status).
     */
  refunded_amount?: number;
  /**
     * Money collected FOR GOODS, bucketed by the method actually tendered
     * (`order_payments`) — money IN. Tips are not in here — see `total_tips`
     * — and refunds are not netted out: they are money OUT with a tender of
     * their own, on `GET /shifts/{id}/refunds` and the refunds dataset.
     */
  revenue_by_method: unknown;
  subtotal: number;
  /** @nullable */
  to?: string | null;
  top_items: ItemSales[];
  /**
     * Delivery fees on the sales in range — inside `total_revenue`, outside
     * the tax base, not food revenue.
     */
  total_delivery_fees?: number;
  total_discount: number;
  /**
     * Units sold (SUM of order_items.quantity) across non-voided orders in
     * range. Counts units, not distinct lines ("3× burger" contributes 3),
     * matching quantity_sold in the item/category breakdowns.
     */
  total_line_items?: number;
  total_orders: number;
  /**
     * What the sales in range are worth after refunds: `gross_sales` less
     * `refunded_amount`. A refund is attributed to the sale it was against,
     * whenever it was issued — the same restatement a full refund makes by
     * flipping the order's status out of the sold set.
     */
  total_revenue: number;
  /**
     * Service charge on the dine-in bills in range — inside `total_revenue`
     * as the shop's income, not a pass-through.
     */
  total_service_charge?: number;
  total_tax: number;
  /**
     * Tips, standalone — never folded into a method bucket and never part of
     * `total_revenue`. Same definition as `total_tips` on the shift report, so
     * the two screens can be reconciled line for line.
     */
  total_tips?: number;
  voided_orders: number;
}
