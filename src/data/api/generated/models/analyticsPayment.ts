/* eslint-disable */
// @ts-nocheck

/**
 * One payment against an order, in the merchant's own payment-method names
 * (e.g. `cash`, `card`, `instapay`).
 */
export interface AnalyticsPayment {
  /** Piastres. */
  amount: number;
  method: string;
}
