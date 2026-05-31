/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface TimeseriesPoint {
  discount: number;
  orders: number;
  period: string;
  revenue: number;
  revenue_by_method: unknown;
  tax: number;
  voided: number;
}
