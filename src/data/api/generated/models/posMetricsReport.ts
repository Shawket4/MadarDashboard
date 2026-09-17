/* eslint-disable */
// @ts-nocheck
import type { PosMetricsHour } from './posMetricsHour';
import type { PosMetricsItem } from './posMetricsItem';
import type { PosMetricsTender } from './posMetricsTender';

export interface PosMetricsReport {
  /** `net_sales / order_count`, rounded half up; 0 with no sales. */
  average_ticket: number;
  branch_id: string;
  from: string;
  gross_sales: number;
  /** Always 24 rows, hour 0 first. */
  hourly: PosMetricsHour[];
  /** Sold sales net of refunds against them (`branch_sales.total_revenue`). */
  net_sales: number;
  /** Sold sales (`branch_sales.total_orders`). */
  order_count: number;
  refunded_amount: number;
  /** Sales refunded in full (out of every sold figure above). */
  refunded_orders_count: number;
  refunds_issued_amount: number;
  /** Refunds ISSUED inside the window at this branch, whichever sale they refund. */
  refunds_issued_count: number;
  /** By amount, largest first. */
  tenders: PosMetricsTender[];
  /** The IANA zone the days were cut in. */
  timezone: string;
  to: string;
  /** Top [`TOP_ITEMS`] by quantity (then revenue, then name). */
  top_items: PosMetricsItem[];
  voided_amount: number;
  voided_count: number;
  /** `[window_from, window_to)`: local midnight of `from` to local midnight after `to`. */
  window_from: string;
  window_to: string;
}
