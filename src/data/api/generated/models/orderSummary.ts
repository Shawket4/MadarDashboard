/* eslint-disable */
// @ts-nocheck

export interface OrderSummary {
  completed: number;
  /** Total delivery charges (piastres) across completed orders in scope.
   * Lets the dashboard surface delivery revenue separately from item sales. */
  delivery_fees?: number;
  discounts: number;
  revenue: number;
  tips: number;
  voided: number;
}
