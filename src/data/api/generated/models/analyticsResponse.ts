/* eslint-disable */
// @ts-nocheck
import type { AnalyticsOrder } from './analyticsOrder';

export interface AnalyticsResponse {
  /**
     * `total_revenue / total_orders`, truncated to whole piastres. 0 when the
     * window is empty.
     */
  avg_order_total: number;
  branch_id: string;
  branch_name: string;
  from: string;
  /**
     * The exact half-open instant window `[from_utc, to_utc)` the figures
     * cover, echoed so there is never a question about what was included.
     */
  from_utc: string;
  /**
     * Echo of the paging actually applied, and how many rows came back.
     * @nullable
     */
  limit?: number | null;
  offset: number;
  orders: AnalyticsOrder[];
  returned: number;
  subtotal: number;
  /** IANA zone the business days were resolved in. */
  timezone: string;
  to: string;
  to_utc: string;
  total_discount: number;
  /**
     * Orders in the window. Voided and refunded orders are excluded here and
     * everywhere below, as are orders tendered with a payment method the
     * merchant has hidden from partners — none are returned at all.
     */
  total_orders: number;
  /** Sum of the per-order `total_amount`. */
  total_revenue: number;
  total_service_charge: number;
  total_tax: number;
}
