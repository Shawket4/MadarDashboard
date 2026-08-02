/* eslint-disable */
// @ts-nocheck

/**
 * One tender against an order (`order_payments`). A split sale has several.
 */
export interface PaymentLeg {
  amount: number;
  method: string;
}
