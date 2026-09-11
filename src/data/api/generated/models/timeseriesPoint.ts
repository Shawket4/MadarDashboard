/* eslint-disable */
// @ts-nocheck

export interface TimeseriesPoint {
  discount: number;
  orders: number;
  period: string;
  refunded?: number;
  /** Net of refunds against the period's sales; `refunded` is what came off. */
  revenue: number;
  revenue_by_method: unknown;
  tax: number;
  voided: number;
}
