/* eslint-disable */
// @ts-nocheck
import type { Order } from './order';
import type { OrderSummary } from './orderSummary';

export interface PaginatedOrders {
  data: Order[];
  page: number;
  per_page: number;
  summary: OrderSummary;
  total: number;
  total_pages: number;
}
