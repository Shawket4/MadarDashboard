/* eslint-disable */
// @ts-nocheck
import type { OrderFull } from './orderFull';
import type { OrderSummary } from './orderSummary';

/**
 * Same envelope as [PaginatedOrders] but each order carries its line items
 * (returned when `include_items=true`).
 */
export interface PaginatedOrdersFull {
  data: OrderFull[];
  page: number;
  per_page: number;
  summary: OrderSummary;
  total: number;
  total_pages: number;
}
