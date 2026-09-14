/* eslint-disable */
// @ts-nocheck

/**
 * One tender against an order (`order_payments`). A split sale has several.
 */
export interface PaymentLeg {
  amount: number;
  /**
     * The leg's stored cash flag (`order_payments.is_cash`), the one the drawer
     * counts by. Additive; `null` for a leg recorded before the flag existed.
     * @nullable
     */
  is_cash?: boolean | null;
  method: string;
}
